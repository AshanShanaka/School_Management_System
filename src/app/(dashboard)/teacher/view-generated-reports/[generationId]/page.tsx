import SavedReportCardsTable from "@/components/SavedReportCardsTable";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";

interface PageProps {
  params: {
    generationId: string;
  };
}

const ViewGeneratedReportsPage = async ({ params }: PageProps) => {
  const { generationId } = params;

  // Fetch generation details
  const generation = await prisma.reportCardGeneration.findUnique({
    where: { id: generationId },
    include: {
      exam: {
        include: {
          examType: true,
        },
      },
      class: true,
    },
  });

  if (!generation) {
    notFound();
  }

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <SavedReportCardsTable
        generationId={generationId}
        examTitle={generation.examTitle}
        className={generation.className}
      />
    </div>
  );
};

export default ViewGeneratedReportsPage;
