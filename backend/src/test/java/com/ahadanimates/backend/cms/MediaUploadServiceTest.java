package com.ahadanimates.backend.cms;

import com.ahadanimates.backend.cms.dto.MediaAssetResponse;
import com.ahadanimates.backend.projects.ProjectRepository;
import com.ahadanimates.backend.projects.ProjectStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class MediaUploadServiceTest {

    @TempDir
    Path storageDirectory;

    private MediaAssetRepository repository;
    private ProjectRepository projectRepository;
    private ContentRepository contentRepository;
    private MediaUploadService service;
    private final AtomicReference<MediaAsset> savedAsset = new AtomicReference<>();

    @BeforeEach
    void setUp() {
        repository = mock(MediaAssetRepository.class);
        projectRepository = mock(ProjectRepository.class);
        contentRepository = mock(ContentRepository.class);
        service = new MediaUploadService(repository, projectRepository, contentRepository, storageDirectory.toString());
        when(repository.save(any(MediaAsset.class))).thenAnswer(invocation -> {
            MediaAsset asset = invocation.getArgument(0);
            ReflectionTestUtils.setField(asset, "id", 42L);
            savedAsset.set(asset);
            return asset;
        });
        when(repository.findById(anyLong())).thenAnswer(invocation -> Optional.ofNullable(savedAsset.get()));
        when(projectRepository.existsPublishedReference(anyString(), any(ProjectStatus.class))).thenReturn(false);
        when(contentRepository.existsPublishedReference(anyString(), any(ProjectStatus.class))).thenReturn(false);
        when(projectRepository.existsAnyReference(anyString())).thenReturn(false);
        when(contentRepository.existsAnyReference(anyString())).thenReturn(false);
    }

    @Test
    void convertsSmallOpaquePngToWebpWithoutUpscalingAndStoresOptimizedMetadata() throws Exception {
        byte[] image = png();
        MockMultipartFile file = new MockMultipartFile(
                "file", "..\\private folder\\poster.png", "image/png", image);

        MediaAssetResponse response = service.upload(file);

        assertEquals("image/webp", response.contentType());
        assertEquals(MediaType.IMAGE, response.mediaType());
        assertEquals("/api/public/media/42", response.url());
        assertTrue(savedAsset.get().getStorageKey().matches("^local/[0-9a-f-]{36}\\.webp$"));
        assertTrue(savedAsset.get().getStorageKey().startsWith("local/"));
        assertFalse(response.url().contains(storageDirectory.toString()));
        assertEquals(2, response.width());
        assertEquals(2, response.height());
        assertEquals((long) image.length, response.originalSizeBytes());
        assertEquals(response.sizeBytes(), Files.size(storageDirectory.resolve(savedAsset.get().getStorageKey())));

        MediaUploadService.StoredMedia stored = service.getFile(42L, true);
        try (var input = stored.resource().getInputStream()) {
            BufferedImage decoded = ImageIO.read(input);
            assertEquals(2, decoded.getWidth());
            assertEquals(2, decoded.getHeight());
        }
    }

    @Test
    void resizesLargeImagesProportionallyAndPersistsOptimizedDimensionsAndSize() throws Exception {
        byte[] largeJpeg = jpeg(2400, 1200);
        MediaAssetResponse response = service.upload(new MockMultipartFile(
                "file", "large.jpg", "image/jpeg", largeJpeg));

        assertEquals("image/webp", response.contentType());
        assertEquals(1920, response.width());
        assertEquals(960, response.height());
        assertEquals((long) largeJpeg.length, response.originalSizeBytes());
        assertTrue(response.sizeBytes() < largeJpeg.length);
        assertEquals(response.width(), savedAsset.get().getWidth());
        assertEquals(response.height(), savedAsset.get().getHeight());
        assertEquals(response.sizeBytes(), Files.size(storageDirectory.resolve(savedAsset.get().getStorageKey())));
        assertTrue(savedAsset.get().getStorageKey().endsWith(".webp"));
    }

    @Test
    void preservesTransparencyAndPngFormatForTransparentPngs() throws Exception {
        BufferedImage transparent = new BufferedImage(2400, 1200, BufferedImage.TYPE_INT_ARGB);
        for (int x = 500; x < 800; x++) {
            for (int y = 300; y < 600; y++) {
                transparent.setRGB(x, y, 0x40112233);
            }
        }

        MediaAssetResponse response = service.upload(new MockMultipartFile(
                "file", "transparent.png", "image/png", encode(transparent, "png")));

        assertEquals("image/png", response.contentType());
        assertTrue(savedAsset.get().getStorageKey().endsWith(".png"));
        assertEquals(1920, response.width());
        assertEquals(960, response.height());
        BufferedImage stored = ImageIO.read(storageDirectory.resolve(savedAsset.get().getStorageKey()).toFile());
        int alpha = (stored.getRGB(520, 360) >>> 24) & 0xff;
        assertTrue(alpha > 0 && alpha < 0xff);
        assertEquals(response.sizeBytes(), Files.size(storageDirectory.resolve(savedAsset.get().getStorageKey())));
    }

    @Test
    void appliesExifPhoneOrientationBeforeSavingDimensions() throws Exception {
        byte[] jpeg = withExifOrientation(jpeg(3, 2), 6);

        MediaAssetResponse response = service.upload(new MockMultipartFile(
                "file", "phone.jpg", "image/jpeg", jpeg));

        assertEquals(2, response.width());
        assertEquals(3, response.height());
    }

    @Test
    void storesVideosWithoutRunningImageOptimization() throws Exception {
        byte[] video = new byte[16];
        System.arraycopy(new byte[]{'f', 't', 'y', 'p'}, 0, video, 4, 4);
        MediaAssetResponse response = service.upload(new MockMultipartFile(
                "file", "clip.mp4", "video/mp4", video));

        assertEquals("video/mp4", response.contentType());
        assertEquals(MediaType.VIDEO, response.mediaType());
        assertEquals(video.length, response.sizeBytes());
        assertTrue(response.width() == null);
        assertTrue(response.height() == null);
        assertTrue(response.originalSizeBytes() == null);
        assertArrayEquals(video, Files.readAllBytes(storageDirectory.resolve(savedAsset.get().getStorageKey())));
    }

    @Test
    void servesImagesPubliclyOnlyWhenReferencedByPublishedContent() throws Exception {
        MediaAssetResponse response = service.upload(new MockMultipartFile(
                "file", "poster.png", "image/png", png()));
        when(projectRepository.existsPublishedReference(response.url(), ProjectStatus.PUBLISHED)).thenReturn(true);

        MediaUploadService.StoredMedia stored = service.getFile(42L, false);

        assertTrue(stored.publicAsset());
        when(projectRepository.existsPublishedReference(response.url(), ProjectStatus.PUBLISHED)).thenReturn(false);
        assertThrows(MediaNotFoundException.class, () -> service.getFile(42L, false));
    }

    @Test
    void rejectsUnsupportedAndMismatchedMimeContentBeforeWriting() throws Exception {
        MockMultipartFile unsupported = new MockMultipartFile(
                "file", "image.png", "image/png", "not an image".getBytes());
        MockMultipartFile mismatched = new MockMultipartFile(
                "file", "poster.png", "image/jpeg", png());

        assertThrows(InvalidMediaException.class, () -> service.upload(unsupported));
        assertThrows(InvalidMediaException.class, () -> service.upload(mismatched));
        verify(repository, never()).save(any(MediaAsset.class));
    }

    @Test
    void rejectsOversizedImagesBeforeReadingThemIntoMemory() {
        byte[] oversized = new byte[15 * 1024 * 1024 + 1];
        System.arraycopy(new byte[]{(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a},
                0, oversized, 0, 8);

        assertThrows(InvalidMediaException.class, () -> service.upload(
                new MockMultipartFile("file", "large.png", "image/png", oversized)));
        verify(repository, never()).save(any(MediaAsset.class));
    }

    @Test
    void deletesUnusedLocalAssetAndRejectsDeletionWhenReferenced() throws Exception {
        MediaAssetResponse response = service.upload(new MockMultipartFile(
                "file", "poster.png", "image/png", png()));
        Path storedFile = storageDirectory.resolve(savedAsset.get().getStorageKey());
        assertTrue(Files.exists(storedFile));

        when(contentRepository.existsAnyReference(response.url())).thenReturn(true);
        assertThrows(MediaAssetInUseException.class, () -> service.delete(42L));
        assertTrue(Files.exists(storedFile));

        when(contentRepository.existsAnyReference(response.url())).thenReturn(false);
        service.delete(42L);

        assertFalse(Files.exists(storedFile));
        verify(repository).delete(savedAsset.get());
    }

    private byte[] png() throws Exception {
        BufferedImage image = new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB);
        return encode(image, "png");
    }

    private byte[] jpeg(int width, int height) throws IOException {
        return encode(new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB), "jpeg");
    }

    private byte[] encode(BufferedImage image, String format) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        ImageIO.write(image, format, output);
        return output.toByteArray();
    }

    private byte[] withExifOrientation(byte[] jpeg, int orientation) throws IOException {
        byte[] exifHeader = {'E', 'x', 'i', 'f', 0, 0};
        byte[] tiff = {
                'I', 'I', 42, 0, 8, 0, 0, 0,
                1, 0,
                0x12, 0x01, 3, 0, 1, 0, 0, 0, (byte) orientation, 0, 0, 0,
                0, 0, 0, 0
        };
        int payloadLength = exifHeader.length + tiff.length;
        ByteBuffer app1 = ByteBuffer.allocate(4 + payloadLength);
        app1.put((byte) 0xff).put((byte) 0xe1).putShort((short) (payloadLength + 2));
        app1.put(exifHeader).put(tiff);

        ByteArrayOutputStream output = new ByteArrayOutputStream();
        output.write(jpeg, 0, 2);
        output.write(app1.array());
        output.write(jpeg, 2, jpeg.length - 2);
        return output.toByteArray();
    }
}
