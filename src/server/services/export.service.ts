export interface ExportService {
  exportJson(projectId: string, versionId: string, ownerId: string): Promise<unknown>;
  exportMarkdown(projectId: string, versionId: string, ownerId: string): Promise<string>;
}
