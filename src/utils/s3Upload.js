import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    credentials: {
        accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
    },
});

/**
 * Upload video file to S3 with progress tracking
 * @param {File} file - Video file to upload
 * @param {string} userId - User ID for organizing files
 * @param {Function} onProgress - Callback for upload progress (0-100)
 * @returns {Promise<string>} - S3 URL of uploaded video
 */
export const uploadVideoToS3 = async (file, userId, onProgress) => {
    try {
        const timestamp = Date.now();
        const fileName = `${userId}/${timestamp}/${file.name}`;

        // Convert File to ArrayBuffer for AWS SDK compatibility
        const arrayBuffer = await file.arrayBuffer();

        // For smaller files, use PutObjectCommand directly to avoid checksum issues
        const command = new PutObjectCommand({
            Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME,
            Key: fileName,
            Body: arrayBuffer,
            ContentType: file.type,
        });

        // Track progress manually for smaller files
        if (onProgress) {
            onProgress(50); // Start
        }

        await s3Client.send(command);

        if (onProgress) {
            onProgress(100); // Complete
        }

        // Construct S3 URL
        const s3Url = `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${fileName}`;

        return s3Url;
    } catch (error) {
        console.error("S3 upload error:", error);
        throw new Error(`Failed to upload video: ${error.message}`);
    }
};

export const uploadAudioToS3 = async (file, userId, onProgress) => {
    try {
        const timestamp = Date.now();
        const ext = file.name.split(".").pop() || "m4a";
        const key = `campaigns/${userId}/social_audio_${timestamp}.${ext}`;
        const arrayBuffer = await file.arrayBuffer();
        if (onProgress) onProgress(50);
        await s3Client.send(new PutObjectCommand({
            Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME,
            Key: key,
            Body: arrayBuffer,
            ContentType: file.type || "audio/mp4",
        }));
        if (onProgress) onProgress(100);
        return `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${key}`;
    } catch (error) {
        console.error("S3 audio upload error:", error);
        throw new Error(`Failed to upload audio: ${error.message}`);
    }
};

/**
 * Generate video thumbnail (optional - can be implemented later)
 * @param {File} videoFile - Video file
 * @returns {Promise<string|null>} - Thumbnail URL or null
 */
export const generateVideoThumbnail = async (videoFile) => {
    // TODO: Implement thumbnail generation
    // This could use canvas to extract first frame
    return null;
};
