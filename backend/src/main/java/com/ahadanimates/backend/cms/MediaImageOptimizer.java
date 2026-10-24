package com.ahadanimates.backend.cms;

import com.drew.imaging.ImageMetadataReader;
import com.drew.imaging.ImageProcessingException;
import com.drew.metadata.Metadata;
import com.drew.metadata.MetadataException;
import com.drew.metadata.exif.ExifIFD0Directory;
import net.coobird.thumbnailator.Thumbnails;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageInputStream;
import javax.imageio.stream.ImageOutputStream;
import java.awt.AlphaComposite;
import java.awt.Graphics2D;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Iterator;
import java.util.Locale;

final class MediaImageOptimizer {

    private static final int MAX_DIMENSION = 1920;
    private static final long MAX_IMAGE_PIXELS = 16_000_000L;
    private static final float WEBP_QUALITY = 0.83f;

    OptimizedImage optimize(byte[] sourceBytes, String sourceContentType) {
        BufferedImage source = decode(sourceBytes, sourceContentType);
        BufferedImage oriented = source;
        BufferedImage resized = null;
        try {
            if ("image/jpeg".equals(sourceContentType)) {
                int orientation = readExifOrientation(sourceBytes);
                if (orientation != 1) {
                    oriented = orient(source, orientation);
                }
            }

            int width = oriented.getWidth();
            int height = oriented.getHeight();
            double scale = Math.min(1.0, (double) MAX_DIMENSION / Math.max(width, height));
            int outputWidth = Math.max(1, (int) Math.round(width * scale));
            int outputHeight = Math.max(1, (int) Math.round(height * scale));
            resized = outputWidth == width && outputHeight == height
                    ? oriented
                    : Thumbnails.of(oriented).size(outputWidth, outputHeight).asBufferedImage();

            boolean preservePngTransparency = "image/png".equals(sourceContentType)
                    && source.getColorModel().hasAlpha();
            String outputContentType = preservePngTransparency ? "image/png" : "image/webp";
            String outputExtension = preservePngTransparency ? "png" : "webp";
            byte[] outputBytes = preservePngTransparency
                    ? encodePng(resized)
                    : encodeWebp(resized);
            return new OptimizedImage(outputBytes, outputContentType, outputExtension,
                    resized.getWidth(), resized.getHeight());
        } catch (IOException exception) {
            throw new MediaStorageUnavailableException("The image optimizer could not process this upload");
        } finally {
            if (resized != null && resized != oriented) {
                resized.flush();
            }
            if (oriented != source) {
                oriented.flush();
            }
            source.flush();
        }
    }

    private BufferedImage decode(byte[] bytes, String contentType) {
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
                String format = reader.getFormatName().toLowerCase(Locale.ROOT);
                if (!matchesContentType(format, contentType)) {
                    throw new InvalidMediaException("The uploaded image format does not match its contents");
                }
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                if (width < 1 || height < 1 || (long) width * height > MAX_IMAGE_PIXELS) {
                    throw new InvalidMediaException("Image dimensions are invalid or exceed the supported limit");
                }
                BufferedImage image = reader.read(0);
                if (image == null) {
                    throw new InvalidMediaException("The uploaded image cannot be decoded");
                }
                return image;
            } finally {
                reader.dispose();
            }
        } catch (IOException exception) {
            throw new InvalidMediaException("The uploaded image cannot be decoded");
        }
    }

    private boolean matchesContentType(String format, String contentType) {
        return switch (contentType) {
            case "image/jpeg" -> format.equals("jpeg") || format.equals("jpg");
            case "image/png" -> format.equals("png");
            case "image/webp" -> format.equals("webp");
            default -> false;
        };
    }

    private int readExifOrientation(byte[] bytes) {
        try {
            Metadata metadata = ImageMetadataReader.readMetadata(new ByteArrayInputStream(bytes));
            ExifIFD0Directory directory = metadata.getFirstDirectoryOfType(ExifIFD0Directory.class);
            return directory == null || !directory.containsTag(ExifIFD0Directory.TAG_ORIENTATION)
                    ? 1 : directory.getInt(ExifIFD0Directory.TAG_ORIENTATION);
        } catch (ImageProcessingException | MetadataException | IOException exception) {
            throw new InvalidMediaException("The uploaded image orientation metadata could not be read");
        }
    }

    private BufferedImage orient(BufferedImage source, int orientation) {
        int width = source.getWidth();
        int height = source.getHeight();
        int outputWidth = orientation >= 5 && orientation <= 8 ? height : width;
        int outputHeight = orientation >= 5 && orientation <= 8 ? width : height;
        AffineTransform transform = new AffineTransform();

        switch (orientation) {
            case 2 -> {
                transform.translate(width, 0);
                transform.scale(-1, 1);
            }
            case 3 -> {
                transform.translate(width, height);
                transform.rotate(Math.PI);
            }
            case 4 -> {
                transform.translate(0, height);
                transform.scale(1, -1);
            }
            case 5 -> transform.setTransform(0, 1, 1, 0, 0, 0);
            case 6 -> {
                transform.translate(height, 0);
                transform.rotate(Math.PI / 2);
            }
            case 7 -> transform.setTransform(0, -1, -1, 0, height, width);
            case 8 -> {
                transform.translate(0, width);
                transform.rotate(-Math.PI / 2);
            }
            default -> throw new InvalidMediaException("The uploaded image has an invalid orientation value");
        }

        BufferedImage result = new BufferedImage(outputWidth, outputHeight,
                source.getColorModel().hasAlpha() ? BufferedImage.TYPE_INT_ARGB : BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = result.createGraphics();
        try {
            graphics.setComposite(AlphaComposite.Src);
            graphics.drawImage(source, transform, null);
        } finally {
            graphics.dispose();
        }
        return result;
    }

    private byte[] encodePng(BufferedImage image) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        if (!ImageIO.write(image, "png", output)) {
            throw new IOException("No PNG image writer is available");
        }
        return output.toByteArray();
    }

    private byte[] encodeWebp(BufferedImage image) throws IOException {
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByMIMEType("image/webp");
        if (!writers.hasNext()) {
            throw new IOException("No WebP image writer is available");
        }
        ImageWriter writer = writers.next();
        try (ByteArrayOutputStream bytes = new ByteArrayOutputStream();
             ImageOutputStream output = ImageIO.createImageOutputStream(bytes)) {
            if (output == null) {
                throw new IOException("Could not create a WebP output stream");
            }
            writer.setOutput(output);
            var parameters = writer.getDefaultWriteParam();
            if (!parameters.canWriteCompressed()) {
                throw new IOException("The WebP writer does not support lossy compression");
            }
            parameters.setCompressionMode(javax.imageio.ImageWriteParam.MODE_EXPLICIT);
            String[] compressionTypes = parameters.getCompressionTypes();
            if (compressionTypes != null) {
                String lossyType = null;
                for (String compressionType : compressionTypes) {
                    if (compressionType.toLowerCase(Locale.ROOT).contains("lossy")) {
                        lossyType = compressionType;
                        break;
                    }
                }
                if (lossyType == null) {
                    throw new IOException("The WebP writer does not expose lossy compression");
                }
                parameters.setCompressionType(lossyType);
            }
            parameters.setCompressionQuality(WEBP_QUALITY);
            writer.write(null, new IIOImage(image, null, null), parameters);
            output.flush();
            return bytes.toByteArray();
        } finally {
            writer.dispose();
        }
    }

    record OptimizedImage(byte[] bytes, String contentType, String extension, int width, int height) {
    }
}
