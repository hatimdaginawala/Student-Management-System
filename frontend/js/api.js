// API Service Module
class ApiService {
  constructor() {
    this.baseURL = CONFIG.API_BASE_URL;
    this.token = localStorage.getItem('token');
  }

  // Set auth token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  // Get auth headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Handle response
  async handleResponse(response) {
    const data = await response.json();
    
    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid
        this.setToken(null);
        window.location.href = CONFIG.ROUTES.LOGIN;
        throw new Error('Session expired. Please login again.');
      }
      
      throw new Error(data.message || 'Something went wrong');
    }
    
    return data;
  }

  // GET request
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${this.baseURL}${endpoint}${queryString ? '?' + queryString : ''}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      });
      return await this.handleResponse(response);
    } catch (error) {
      throw error;
    }
  }

  // POST request
  async post(endpoint, data = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });
      return await this.handleResponse(response);
    } catch (error) {
      throw error;
    }
  }

  // PUT request
  async put(endpoint, data = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });
      return await this.handleResponse(response);
    } catch (error) {
      throw error;
    }
  }

  // PATCH request
  async patch(endpoint, data = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });
      return await this.handleResponse(response);
    } catch (error) {
      throw error;
    }
  }

  // DELETE request
  async delete(endpoint) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      return await this.handleResponse(response);
    } catch (error) {
      throw error;
    }
  }

  // Upload file - Fixed version matching your existing pattern
  async upload(endpoint, formData, method = 'POST') {
    try {
      // Don't include Content-Type header - browser will set it automatically with boundary for FormData
      const headers = {};
      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }
      
      console.log('Upload request:', {
        url: `${this.baseURL}${endpoint}`,
        method: method,
        headers: headers,
        hasFormData: !!formData
      });
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: method,
        headers: headers,
        body: formData
      });
      
      return await this.handleResponse(response);
    } catch (error) {
      console.error('Upload error:', error);
      if (error.message === 'Failed to fetch') {
        throw new Error('Network error. Please check your connection.');
      }
      throw error;
    }
  }
}

// Create global API instance
const api = new ApiService();