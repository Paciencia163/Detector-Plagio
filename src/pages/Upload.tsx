import { MainLayout } from "@/components/layout/MainLayout";
import { DocumentUpload } from "@/components/upload/DocumentUpload";

export default function Upload() {
  return (
    <MainLayout
      title="Nova Análise"
      subtitle="Submeta documentos para verificação de originalidade"
    >
      <div className="animate-fade-in">
        <DocumentUpload />
      </div>
    </MainLayout>
  );
}
