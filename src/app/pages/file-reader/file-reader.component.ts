import { Component } from '@angular/core';

@Component({
    selector: 'app-file-reader',
    templateUrl: './file-reader.component.html',
    styleUrls: ['./file-reader.component.scss'],
    standalone: false
})
export class FileReaderComponent {
  selectedFiles: FileList | null = null;
  foundExpressions: { fileName: string, expression: string }[] = [];

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles = input.files;
      this.foundExpressions = []; // Limpiar datos previos
      this.readFiles();
    }
  }

  private readFiles(): void {
    if (this.selectedFiles) {
      for (let i = 0; i < this.selectedFiles.length; i++) {
        const file = this.selectedFiles[i];
        const fileExtension = file.name.split('.').pop()?.toUpperCase();
        const validExtensions = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

        if (validExtensions.includes(fileExtension!)) {
          const reader = new FileReader();
          reader.onload = (e: any) => {
            const content = e.target.result;
            this.processFileContent(content, file.name);
          };
          reader.readAsText(file);
        }
      }
    }
  }

  private processFileContent(content: string, fileName: string): void {
    const lines = content.split('\n');
    for (const line of lines) {
      const startIndex = line.indexOf('COM-');
      if (startIndex !== -1) {
        const endIndex = line.indexOf(';', startIndex);
        const expression = endIndex !== -1 ? line.substring(startIndex, endIndex) : line.substring(startIndex);
        this.foundExpressions.push({ fileName: fileName, expression: expression });
      }
    }
  }
}
