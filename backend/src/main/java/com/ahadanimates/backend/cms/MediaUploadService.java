package com.ahadanimates.backend.cms;

import com.ahadanimates.backend.cms.dto.MediaAssetResponse;
import com.ahadanimates.backend.projects.ProjectStatus;
import com.ahadanimates.backend.projects.ProjectRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.LinkOption;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class MediaUploadService {

    private static final Logger log = LoggerFactory.getLogger(MediaUploadService.class);
    private static final long MAX_IMAGE_SIZE = 15L * 1024 * 1024;
    private static final long MAX_VIDEO_SIZE = 250L * 1024 * 1024;
    private static final long MAX_IMAGE_PIXELS = 16_000_000L;
    private static final byte[] PNG = {(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a};
    private static final byte[] JPEG = {(byte) 0xff, (byte) 0xd8, (byte) 0xff};
    private static final byte[] WEBP_RIFF = {'R', 'I', 'F', 'F'};
    private static final byte[] WEBP_WEBP = {'W', 'E', 'B', 'P'};
    private static final byte[] WEBM = {0x1a, 0x45, (byte) 0xdf, (byte) 0xa3};

    private final MediaAssetRepository repository;
    private final ProjectRepository projectRepository;
    private final ContentRepository contentRepository;
    private final Path configuredDirectory;
    private final MediaImageOptimizer imageOptimizer = new MediaImageOptimizer();

    public MediaUploadService(
            MediaAssetRepository repository,
            ProjectRepository projectRepository,
            ContentRepository contentRepository,
            @Value("${media.storage.directory:./data/media}") String directory
    ) {
        this.repository = repository;
        this.projectRepository = projectRepository;
        this.contentRepository = contentRepository;
        this.configuredDirectory = Path.of(directory).toAbsolutePath().normalize();
    }

    @Transactional
    public MediaAssetResponse upload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidMediaException("Choose a non-empty media file");
        }

        DetectedMedia detected = detect(file);
        long maxBytes = detected.mediaType() == MediaType.IMAGE ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
        if (file.getSize() > maxBytes) {
            throw new InvalidMediaException(detected.mediaType() == MediaType.IMAGE
                    ? "Images must be 15 MB or smaller"
                    : "Videos must be 250 MB or smaller");
        }

        MediaImageOptimizer.OptimizedImage optimizedImage = detected.mediaType() == MediaType.IMAGE
                ? imageOptimizer.optimize(readImageBytes(file), detected.contentType())
                : null;
        String storedContentType = optimizedImage == null ? detected.contentType() : optimizedImage.contentType();
        String storedExtension = optimizedImage == null ? detected.extension() : optimizedImage.extension();
        Integer width = optimizedImage == null ? null : optimizedImage.width();
        Integer height = optimizedImage == null ? null : optimizedImage.height();
        long storedSize = optimizedImage == null ? file.getSize() : optimizedImage.bytes().length;
        String originalName = safeOriginalFilename(file.getOriginalFilename(), detected.extension());
        String key = "local/" + UUID.randomUUID() + "." + storedExtension;
        Path destination = resolveStoragePath(key);
        try {
            Files.createDirectories(destination.getParent());
            verifyStorageDirectory(destination.getParent());
            if (optimizedImage != null) {
                Files.write(destination, optimizedImage.bytes(), StandardOpenOption.CREATE_NEW);
            } else {
                try (InputStream input = file.getInputStream()) {
                    Files.copy(input, destination);
                }
            }
        } catch (IOException exception) {
            deleteStoredFileIfPresent(destination, key);
            log.error("Local media upload failed for generated storage key {}", key, exception);
            throw new MediaStorageUnavailableException("Local media storage could not save this upload");
        }
        try {
            MediaAsset asset = repository.save(new MediaAsset(
                    key,
                    "",
                    originalName,
                    storedContentType,
                    detected.mediaType(),
                    storedSize,
                    width,
                    height
            ));
            asset.setPublicUrl(publicPath(asset.getId()));
            return MediaAssetResponse.from(repository.save(asset),
                    optimizedImage == null ? null : file.getSize());
        } catch (RuntimeException exception) {
            deleteStoredFileIfPresent(destination, key);
            throw exception;
        }
    }

    @Transactional(readOnly = true)
    public List<MediaAssetResponse> listRecent() {
        return repository.findTop100ByOrderByCreatedAtDesc().stream()
                .map(MediaAssetResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public StoredMedia getFile(Long id, boolean administrator) {
        MediaAsset asset = repository.findById(id)
                .orElseThrow(() -> new MediaNotFoundException("Media file not found"));
        if (!isLocalKey(asset.getStorageKey())) {
            throw new MediaNotFoundException("Media file not found");
        }
        String publicPath = publicPath(id);
        boolean publicAsset = isReferencedByPublishedContent(publicPath);
        if (!administrator && !publicAsset) {
            throw new MediaNotFoundException("Media file not found");
        }
        Path path = resolveStoragePath(asset.getStorageKey());
        try {
            Path realRoot = getStorageRoot().toRealPath();
            verifyStorageDirectory(path.getParent());
            Path realFile = path.toRealPath(LinkOption.NOFOLLOW_LINKS);
            if (!realFile.startsWith(realRoot) || !Files.isRegularFile(realFile, LinkOption.NOFOLLOW_LINKS)) {
                throw new MediaNotFoundException("Media file not found");
            }
            return new StoredMedia(new FileSystemResource(realFile), asset.getContentType(),
                    publicAsset);
        } catch (IOException exception) {
            throw new MediaNotFoundException("Media file not found");
        }
    }

    @Transactional
    public void delete(Long id) {
        MediaAsset asset = repository.findById(id)
                .orElseThrow(() -> new MediaNotFoundException("Media asset not found"));
        if (!isLocalKey(asset.getStorageKey())) {
            throw new MediaAssetInUseException(
                    "This asset is from the legacy external storage provider and cannot be deleted from local storage");
        }
        String publicPath = publicPath(id);
        if (isReferencedByAnyContent(publicPath)) {
            throw new MediaAssetInUseException("This media asset is referenced by a project or CMS entry and cannot be deleted");
        }
        deleteStoredFile(resolveStoragePath(asset.getStorageKey()), asset.getStorageKey());
        repository.delete(asset);
    }

    private DetectedMedia detect(MultipartFile file) {
        String filename = file.getOriginalFilename() == null
                ? "" : file.getOriginalFilename().toLowerCase(Locale.ROOT);
        byte[] header = new byte[16];
        try (InputStream input = file.getInputStream()) {
            int read = input.read(header);
            if (read < 4) {
                throw new InvalidMediaException("The uploaded file is not a supported image or video");
            }
        } catch (IOException exception) {
            throw new InvalidMediaException("The uploaded file could not be read");
        }

        DetectedMedia detected;
        if (startsWith(header, PNG) && filename.endsWith(".png")) {
            detected = new DetectedMedia("image/png", "png", MediaType.IMAGE);
        } else if (startsWith(header, JPEG) && (filename.endsWith(".jpg") || filename.endsWith(".jpeg"))) {
            detected = new DetectedMedia("image/jpeg", filename.endsWith(".jpeg") ? "jpeg" : "jpg", MediaType.IMAGE);
        } else if (startsWith(header, WEBP_RIFF) && matchesAt(header, 8, WEBP_WEBP) && filename.endsWith(".webp")) {
            detected = new DetectedMedia("image/webp", "webp", MediaType.IMAGE);
        } else if (matchesAt(header, 4, new byte[]{'f', 't', 'y', 'p'})
                && (filename.endsWith(".mp4") || filename.endsWith(".m4v"))) {
            detected = new DetectedMedia("video/mp4", "mp4", MediaType.VIDEO);
        } else if (startsWith(header, WEBM) && filename.endsWith(".webm")) {
            detected = new DetectedMedia("video/webm", "webm", MediaType.VIDEO);
        } else {
            throw new InvalidMediaException("Only valid JPG, PNG, WebP, MP4, or WebM files are supported");
        }

        String suppliedType = file.getContentType();
        if (suppliedType == null || !detected.contentType().equalsIgnoreCase(suppliedType.trim())) {
            throw new InvalidMediaException("The uploaded MIME type does not match the file contents");
        }
        if (detected.mediaType() == MediaType.IMAGE) {
            validateImage(file, detected);
        }
        return detected;
    }

    private byte[] readImageBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException exception) {
            throw new InvalidMediaException("The uploaded image could not be read");
        }
    }

    private void validateImage(MultipartFile file, DetectedMedia detected) {
        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new InvalidMediaException("Images must be 15 MB or smaller");
        }
        try {
            byte[] bytes = file.getBytes();
            if (detected.contentType().equals("image/webp")) {
                validateWebp(bytes);
                return;
            }
            try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
                if (input == null) {
                    throw new InvalidMediaException("The uploaded image cannot be decoded");
                }
                Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
                if (!readers.hasNext()) {
                    throw new InvalidMediaException("The uploaded image cannot be decoded");
                }
                ImageReader reader = readers.next();
                try {
                    reader.setInput(input, true, true);
                    int width = reader.getWidth(0);
                    int height = reader.getHeight(0);
                    if (width < 1 || height < 1 || (long) width * height > MAX_IMAGE_PIXELS) {
                        throw new InvalidMediaException("Image dimensions are invalid or exceed the supported limit");
                    }
                    String format = reader.getFormatName();
                    if (detected.contentType().equals("image/png") && !"png".equalsIgnoreCase(format)
                            || detected.contentType().equals("image/jpeg")
                            && !"jpeg".equalsIgnoreCase(format) && !"jpg".equalsIgnoreCase(format)) {
                        throw new InvalidMediaException("The uploaded image format does not match its contents");
                    }
                    var decoded = reader.read(0);
                    if (decoded == null) {
                        throw new InvalidMediaException("The uploaded image cannot be decoded");
                    }
                    decoded.flush();
                } finally {
                    reader.dispose();
                }
            }
        } catch (IOException exception) {
            throw new InvalidMediaException("The uploaded image cannot be decoded");
        }
    }

    private void validateWebp(byte[] bytes) {
        if (bytes.length < 30
                || !matchesAt(bytes, 0, WEBP_RIFF)
                || !matchesAt(bytes, 8, WEBP_WEBP)
                || !isWebpChunk(bytes, 12)) {
            throw new InvalidMediaException("The uploaded WebP image cannot be decoded");
        }
        long riffSize = littleEndianUnsignedInt(bytes, 4);
        long chunkSize = littleEndianUnsignedInt(bytes, 16);
        if (riffSize + 8 > bytes.length || chunkSize < 1 || chunkSize + 20 > bytes.length) {
            throw new InvalidMediaException("The uploaded WebP image is incomplete");
        }
        int width;
        int height;
        if (matchesAt(bytes, 12, new byte[]{'V', 'P', '8', ' '})) {
            if (chunkSize < 10 || !matchesAt(bytes, 23, new byte[]{(byte) 0x9d, 0x01, 0x2a})) {
                throw new InvalidMediaException("The uploaded WebP image cannot be decoded");
            }
            width = (bytes[26] & 0xff) | ((bytes[27] & 0x3f) << 8);
            height = (bytes[28] & 0xff) | ((bytes[29] & 0x3f) << 8);
        } else if (matchesAt(bytes, 12, new byte[]{'V', 'P', '8', 'L'})) {
            if (chunkSize < 5 || (bytes[20] & 0xff) != 0x2f) {
                throw new InvalidMediaException("The uploaded WebP image cannot be decoded");
            }
            width = 1 + (bytes[21] & 0xff) + ((bytes[22] & 0x3f) << 8);
            height = 1 + ((bytes[22] & 0xc0) >> 6) + ((bytes[23] & 0xff) << 2)
                    + ((bytes[24] & 0x0f) << 10);
        } else {
            if (chunkSize < 10) {
                throw new InvalidMediaException("The uploaded WebP image cannot be decoded");
            }
            width = 1 + (bytes[24] & 0xff) + ((bytes[25] & 0xff) << 8) + ((bytes[26] & 0xff) << 16);
            height = 1 + (bytes[27] & 0xff) + ((bytes[28] & 0xff) << 8) + ((bytes[29] & 0xff) << 16);
        }
        if (width < 1 || height < 1 || (long) width * height > MAX_IMAGE_PIXELS) {
            throw new InvalidMediaException("Image dimensions are invalid or exceed the supported limit");
        }
    }

    private boolean isWebpChunk(byte[] bytes, int offset) {
        return matchesAt(bytes, offset, new byte[]{'V', 'P', '8', ' '})
                || matchesAt(bytes, offset, new byte[]{'V', 'P', '8', 'L'})
                || matchesAt(bytes, offset, new byte[]{'V', 'P', '8', 'X'});
    }

    private long littleEndianUnsignedInt(byte[] bytes, int offset) {
        return (bytes[offset] & 0xffL)
                | ((bytes[offset + 1] & 0xffL) << 8)
                | ((bytes[offset + 2] & 0xffL) << 16)
                | ((bytes[offset + 3] & 0xffL) << 24);
    }

    private boolean isReferencedByPublishedContent(String path) {
        return projectRepository.existsPublishedReference(path, ProjectStatus.PUBLISHED)
                || contentRepository.existsPublishedReference(path, ProjectStatus.PUBLISHED);
    }

    private boolean isReferencedByAnyContent(String path) {
        return projectRepository.existsAnyReference(path)
                || contentRepository.existsAnyReference(path);
    }

    private Path getStorageRoot() {
        return configuredDirectory;
    }

    private void verifyStorageDirectory(Path directory) throws IOException {
        Path realRoot = getStorageRoot().toRealPath();
        Path realDirectory = directory.toRealPath();
        if (!realDirectory.startsWith(realRoot)) {
            throw new IOException("Media storage directory resolves outside its configured root");
        }
    }

    private Path resolveStoragePath(String key) {
        if (!isLocalKey(key)) {
            throw new MediaNotFoundException("Media file not found");
        }
        Path root = getStorageRoot();
        Path resolved = root.resolve(key).normalize();
        if (!resolved.startsWith(root)) {
            throw new MediaNotFoundException("Media file not found");
        }
        return resolved;
    }

    private boolean isLocalKey(String key) {
        return key != null && key.matches("^local/[0-9a-f-]{36}\\.(?:jpg|jpeg|png|webp|mp4|webm)$");
    }

    private void deleteStoredFile(Path file, String key) {
        try {
            Files.deleteIfExists(file);
        } catch (IOException exception) {
            log.error("Unable to delete local media file for storage key {}", key, exception);
            throw new MediaStorageUnavailableException("Local media storage could not delete this file");
        }
    }

    private void deleteStoredFileIfPresent(Path file, String key) {
        try {
            Files.deleteIfExists(file);
        } catch (IOException exception) {
            log.error("Unable to remove incomplete local media file for storage key {}", key, exception);
        }
    }

    private String publicPath(Long id) {
        return "/api/public/media/" + id;
    }

    private boolean startsWith(byte[] value, byte[] prefix) {
        return matchesAt(value, 0, prefix);
    }

    private boolean matchesAt(byte[] value, int offset, byte[] expected) {
        if (value.length < offset + expected.length) {
            return false;
        }
        for (int index = 0; index < expected.length; index++) {
            if (value[offset + index] != expected[index]) {
                return false;
            }
        }
        return true;
    }

    private String safeOriginalFilename(String originalFilename, String extension) {
        if (originalFilename == null || originalFilename.isBlank()) {
            return "upload." + extension;
        }
        String basename = originalFilename.replace('\\', '/');
        basename = basename.substring(basename.lastIndexOf('/') + 1)
                .replaceAll("[^A-Za-z0-9._-]", "_");
        if (basename.length() > 240) {
            basename = basename.substring(basename.length() - 240);
        }
        return basename.isBlank() ? "upload." + extension : basename;
    }

    public record StoredMedia(Resource resource, String contentType, boolean publicAsset) {
    }

    private record DetectedMedia(String contentType, String extension, MediaType mediaType) {
    }
}
