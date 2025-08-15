/**
 * Google Drive Service
 * 
 * Handles actual Google Drive API operations for file upload, download,
 * and management using the OAuth access token.
 */

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
}

export class GoogleDriveService {
  private static readonly DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
  private static readonly UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3';
  private static readonly FOLDER_NAME = 'ScienceHabits';

  /**
   * Get the stored access token
   */
  private static getAccessToken(): string | null {
    return localStorage.getItem('google_drive_token');
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Make authenticated request to Google Drive API
   */
  private static async makeRequest(
    url: string, 
    options: RequestInit = {}
  ): Promise<Response> {
    const token = this.getAccessToken();
    if (!token) {
      throw new Error('No Google Drive access token available');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired
        localStorage.removeItem('google_drive_token');
        throw new Error('Google Drive authentication expired. Please sign in again.');
      }
      throw new Error(`Google Drive API error: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  /**
   * Find or create the ScienceHabits folder
   */
  static async ensureFolder(): Promise<string> {
    try {
      // First, search for existing ScienceHabits folder
      const searchUrl = `${this.DRIVE_API_BASE}/files?q=name='${this.FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      const searchResponse = await this.makeRequest(searchUrl);
      const searchData = await searchResponse.json();

      if (searchData.files && searchData.files.length > 0) {
        console.log('Found existing ScienceHabits folder:', searchData.files[0].id);
        return searchData.files[0].id;
      }

      // Create the folder if it doesn't exist
      const createUrl = `${this.DRIVE_API_BASE}/files`;
      const createResponse = await this.makeRequest(createUrl, {
        method: 'POST',
        body: JSON.stringify({
          name: this.FOLDER_NAME,
          mimeType: 'application/vnd.google-apps.folder',
        }),
      });

      const folderData = await createResponse.json();
      console.log('Created ScienceHabits folder:', folderData.id);
      return folderData.id;

    } catch (error) {
      console.error('Failed to ensure ScienceHabits folder:', error);
      throw error;
    }
  }

  /**
   * Upload or update a file in the ScienceHabits folder
   */
  static async uploadFile(
    fileName: string, 
    content: string, 
    mimeType: string = 'application/json'
  ): Promise<GoogleDriveFile> {
    try {
      const folderId = await this.ensureFolder();

      // Check if file already exists
      const searchUrl = `${this.DRIVE_API_BASE}/files?q=name='${fileName}' and parents in '${folderId}' and trashed=false`;
      const searchResponse = await this.makeRequest(searchUrl);
      const searchData = await searchResponse.json();

      const blob = new Blob([content], { type: mimeType });
      
      if (searchData.files && searchData.files.length > 0) {
        // Update existing file
        const fileId = searchData.files[0].id;
        const updateUrl = `${this.UPLOAD_API_BASE}/files/${fileId}?uploadType=media`;
        
        const updateResponse = await this.makeRequest(updateUrl, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.getAccessToken()}`,
            'Content-Type': mimeType,
          },
          body: blob,
        });

        const updatedFile = await updateResponse.json();
        console.log(`Updated file: ${fileName}`);
        return updatedFile;
      } else {
        // Create new file
        const createUrl = `${this.UPLOAD_API_BASE}/files?uploadType=multipart`;
        
        // Create multipart form data
        const metadata = {
          name: fileName,
          parents: [folderId],
        };

        const formData = new FormData();
        formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        formData.append('file', blob);

        const createResponse = await fetch(createUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.getAccessToken()}`,
          },
          body: formData,
        });

        if (!createResponse.ok) {
          throw new Error(`Failed to create file: ${createResponse.status}`);
        }

        const newFile = await createResponse.json();
        console.log(`Created file: ${fileName}`);
        return newFile;
      }
    } catch (error) {
      console.error(`Failed to upload file ${fileName}:`, error);
      throw error;
    }
  }

  /**
   * Download a file from the ScienceHabits folder
   */
  static async downloadFile(fileName: string): Promise<string | null> {
    try {
      const folderId = await this.ensureFolder();

      // Search for the file
      const searchUrl = `${this.DRIVE_API_BASE}/files?q=name='${fileName}' and parents in '${folderId}' and trashed=false`;
      const searchResponse = await this.makeRequest(searchUrl);
      const searchData = await searchResponse.json();

      if (!searchData.files || searchData.files.length === 0) {
        console.log(`File not found: ${fileName}`);
        return null;
      }

      const fileId = searchData.files[0].id;
      
      // Download the file content
      const downloadUrl = `${this.DRIVE_API_BASE}/files/${fileId}?alt=media`;
      const downloadResponse = await this.makeRequest(downloadUrl);
      const content = await downloadResponse.text();

      console.log(`Downloaded file: ${fileName}`);
      return content;

    } catch (error) {
      console.error(`Failed to download file ${fileName}:`, error);
      throw error;
    }
  }

  /**
   * List files in the ScienceHabits folder
   */
  static async listFiles(): Promise<GoogleDriveFile[]> {
    try {
      const folderId = await this.ensureFolder();

      const listUrl = `${this.DRIVE_API_BASE}/files?q=parents in '${folderId}' and trashed=false&fields=files(id,name,mimeType,modifiedTime,size)`;
      const response = await this.makeRequest(listUrl);
      const data = await response.json();

      return data.files || [];

    } catch (error) {
      console.error('Failed to list files:', error);
      throw error;
    }
  }

  /**
   * Delete a file from the ScienceHabits folder
   */
  static async deleteFile(fileName: string): Promise<boolean> {
    try {
      const folderId = await this.ensureFolder();

      // Search for the file
      const searchUrl = `${this.DRIVE_API_BASE}/files?q=name='${fileName}' and parents in '${folderId}' and trashed=false`;
      const searchResponse = await this.makeRequest(searchUrl);
      const searchData = await searchResponse.json();

      if (!searchData.files || searchData.files.length === 0) {
        console.log(`File not found for deletion: ${fileName}`);
        return false;
      }

      const fileId = searchData.files[0].id;
      
      // Delete the file
      const deleteUrl = `${this.DRIVE_API_BASE}/files/${fileId}`;
      await this.makeRequest(deleteUrl, {
        method: 'DELETE',
      });

      console.log(`Deleted file: ${fileName}`);
      return true;

    } catch (error) {
      console.error(`Failed to delete file ${fileName}:`, error);
      throw error;
    }
  }

  /**
   * Test connection to Google Drive
   */
  static async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.ensureFolder();
      
      // Try to list files to verify access
      await this.listFiles();
      
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Failed to connect to Google Drive' 
      };
    }
  }

  /**
   * Sign out and clear tokens
   */
  static signOut(): void {
    localStorage.removeItem('google_drive_token');
    console.log('Google Drive signed out');
  }
}