import { Injectable } from '@angular/core';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { delay, map, tap } from 'rxjs/operators';
import { Document } from '../models/user.model';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private readonly DOCUMENTS_KEY = 'sistema_contable_documents';
  private documentsSubject = new BehaviorSubject<Document[]>(this.getDocumentsFromStorage());
  public documents$ = this.documentsSubject.asObservable();

  constructor() {}

  private getDocumentsFromStorage(): Document[] {
    const documentsStr = localStorage.getItem(this.DOCUMENTS_KEY);
    if (documentsStr) {
      try {
        return JSON.parse(documentsStr);
      } catch {
        return [];
      }
    }
    return [];
  }

  private saveDocumentsToStorage(documents: Document[]): void {
    localStorage.setItem(this.DOCUMENTS_KEY, JSON.stringify(documents));
    this.documentsSubject.next(documents);
  }

  uploadDocument(file: File, serviceId: string): Observable<Document> {
    // Validar archivo antes de subir
    const validation = this.validateDocument(file);
    if (!validation.valid) {
      return throwError(() => new Error(validation.message || 'Archivo no válido'));
    }

    // Simular upload de archivo
    const document: Document = {
      id: uuidv4(),
      name: file.name,
      url: URL.createObjectURL(file), // En producción sería la URL del servidor
      type: file.type,
      uploadedAt: new Date()
    };

    const documents = this.getDocumentsFromStorage();
    documents.push(document);
    this.saveDocumentsToStorage(documents);

    return of(document).pipe(
      delay(500), // Reducir delay para mejor UX
      tap(() => console.log('Documento subido exitosamente:', document.name))
    );
  }

  getDocumentsByServiceId(serviceId: string): Observable<Document[]> {
    // En una implementación real, filtrarías por serviceId
    const documents = this.getDocumentsFromStorage();
    return of(documents).pipe(
      delay(100), // Reducir delay
      tap(() => console.log('Documentos cargados para servicio:', serviceId))
    );
  }

  getAllDocuments(): Observable<Document[]> {
    return this.documents$;
  }

  deleteDocument(documentId: string): Observable<boolean> {
    const documents = this.getDocumentsFromStorage();
    const index = documents.findIndex(doc => doc.id === documentId);
    
    if (index === -1) {
      return throwError(() => new Error('Documento no encontrado'));
    }

    // Liberar la URL del objeto si existe
    const document = documents[index];
    if (document.url.startsWith('blob:')) {
      URL.revokeObjectURL(document.url);
    }

    documents.splice(index, 1);
    this.saveDocumentsToStorage(documents);
    
    return of(true).pipe(
      delay(200), // Reducir delay
      tap(() => console.log('Documento eliminado:', documentId))
    );
  }

  downloadDocument(documentId: string): Observable<Blob> {
    const documents = this.getDocumentsFromStorage();
    const document = documents.find(doc => doc.id === documentId);
    
    if (!document) {
      return throwError(() => new Error('Documento no encontrado'));
    }

    // Simular descarga (en producción haría fetch al servidor)
    return new Observable(observer => {
      try {
        fetch(document.url)
          .then(response => {
            if (!response.ok) {
              throw new Error('Error al descargar el documento');
            }
            return response.blob();
          })
          .then(blob => {
            observer.next(blob);
            observer.complete();
          })
          .catch(error => {
            console.error('Error en descarga:', error);
            observer.error(error);
          });
      } catch (error) {
        observer.error(error);
      }
    });
  }

  validateDocument(file: File): { valid: boolean; message?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/plain'
    ];

    if (file.size > maxSize) {
      return {
        valid: false,
        message: 'El archivo no puede ser mayor a 10MB'
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        message: 'Tipo de archivo no permitido. Solo se permiten PDF, imágenes, Excel y archivos de texto'
      };
    }

    return { valid: true };
  }

  getDocumentPreview(documentId: string): Observable<string> {
    const documents = this.getDocumentsFromStorage();
    const document = documents.find(doc => doc.id === documentId);
    
    if (!document) {
      return throwError(() => new Error('Documento no encontrado'));
    }

    // Para documentos que son imágenes, devolver la URL directamente
    if (document.type.startsWith('image/')) {
      return of(document.url).pipe(
        delay(100),
        tap(() => console.log('Preview de imagen generado:', document.name))
      );
    }

    // Para otros tipos, devolver una URL de preview simulada
    return of(`data:text/html,<h3>Preview de ${document.name}</h3><p>Tipo: ${document.type}</p>`).pipe(
      delay(100),
      tap(() => console.log('Preview genérico generado:', document.name))
    );
  }

  searchDocuments(query: string): Observable<Document[]> {
    const documents = this.getDocumentsFromStorage();
    
    if (!query || query.trim().length === 0) {
      return of(documents).pipe(delay(100));
    }
    
    const filtered = documents.filter(doc => 
      doc.name.toLowerCase().includes(query.toLowerCase()) ||
      doc.type.toLowerCase().includes(query.toLowerCase())
    );
    
    return of(filtered).pipe(
      delay(200),
      tap(results => console.log(`Búsqueda "${query}" encontró ${results.length} documentos`))
    );
  }

  // Método para limpiar URLs de blob cuando se destruye el componente
  cleanupBlobUrls(): void {
    const documents = this.getDocumentsFromStorage();
    documents.forEach(doc => {
      if (doc.url.startsWith('blob:')) {
        URL.revokeObjectURL(doc.url);
      }
    });
  }
}
