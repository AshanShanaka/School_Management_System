import prisma from "@/lib/prisma";

export interface BatchImportResult {
  success: boolean;
  processed: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
}

export class BatchImportProcessor {
  private batchSize: number;

  constructor(batchSize: number = 100) {
    this.batchSize = batchSize;
  }

  async processBatch<T>(
    data: T[],
    processor: (batch: T[]) => Promise<void>
  ): Promise<BatchImportResult> {
    const result: BatchImportResult = {
      success: true,
      processed: 0,
      errors: [],
    };

    // Process data in batches
    for (let i = 0; i < data.length; i += this.batchSize) {
      const batch = data.slice(i, i + this.batchSize);

      try {
        await processor(batch);
        result.processed += batch.length;
      } catch (error) {
        result.success = false;
        result.errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return result;
  }

  async processWithTransaction<T>(
    data: T[],
    processor: (batch: T[], transaction: any) => Promise<void>
  ): Promise<BatchImportResult> {
    const result: BatchImportResult = {
      success: true,
      processed: 0,
      errors: [],
    };

    // Process data in batches with database transactions
    for (let i = 0; i < data.length; i += this.batchSize) {
      const batch = data.slice(i, i + this.batchSize);

      try {
        await prisma.$transaction(async (tx) => {
          await processor(batch, tx);
        });
        result.processed += batch.length;
      } catch (error) {
        result.success = false;
        result.errors.push({
          row: i + 1,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return result;
  }
}
