"use client";

import BlogForm from "@/components/admin/blog/BlogForm";
import { useParams } from "next/navigation";

export default function EditBlogPage() {
    const params = useParams();
    const { id } = params;

    return <BlogForm blogId={id} />;
}
