"use client";

import { useParams } from "next/navigation";
import CaseStudyForm from "@/components/admin/caseStudy/CaseStudyForm";

export default function EditCaseStudyPage() {
    const params = useParams();
    return <CaseStudyForm caseStudyId={params.id} isEditing={true} />;
}
