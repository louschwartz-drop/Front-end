import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Initialize S3 Client
const s3Client = new S3Client({
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    credentials: {
        accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
    },
});

/**
 * Uploads a file to AWS S3 bucket
 * @param {File | Blob} file - The file to upload
 * @param {string} folder - Optional folder path within bucket
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
export const uploadFileToS3 = async (file, folder = "profile-images") => {
    if (!file) {
        throw new Error("No file provided for upload");
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const extension = file.type.split("/")[1] || "jpg";
    const fileName = `${folder}/${timestamp}-${randomString}.${extension}`;

    // Convert Blob to ArrayBuffer to avoid "readableStream.getReader is not a function" error
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    const params = {
        Bucket: process.env.NEXT_PUBLIC_AWS_BUCKET_NAME,
        Key: fileName,
        Body: fileBuffer,
        ContentType: file.type,
        // ACL: 'public-read', // Uncomment if bucket is not public by default but ACLs are enabled
    };

    try {
        const command = new PutObjectCommand(params);
        await s3Client.send(command);

        // Construct public URL
        // Format: https://{bucket-name}.s3.{region}.amazonaws.com/{key}
        const publicUrl = `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${fileName}`;

        return publicUrl;
    } catch (error) {
        console.error("Error uploading file to S3:", error);
        throw new Error("Failed to upload image to cloud storage");
    }
};
