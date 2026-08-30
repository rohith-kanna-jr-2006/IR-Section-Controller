import api from './api.js';

export const importApi = {
  /**
   * Uploads raw timetable input (Multipart or JSON body)
   */
  async uploadTimetable({
    file,
    rawInput,
    format = 'AUTO',
    sourceType = 'USER_PROVIDED',
    sourceAuthority = 'CONTROLLER_INPUT',
    authorityLevel = 'SECONDARY',
    targetType = 'NEW_SCENARIO',
    targetScenarioId = null,
    targetScenarioName = 'Imported Corridor Schedule'
  }) {
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('format', format);
      formData.append('sourceType', sourceType);
      formData.append('sourceAuthority', sourceAuthority);
      formData.append('authorityLevel', authorityLevel);
      formData.append('targetType', targetType);
      if (targetScenarioId) formData.append('targetScenarioId', targetScenarioId);
      if (targetScenarioName) formData.append('targetScenarioName', targetScenarioName);

      const res = await api.post('/imports/timetable', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return res.data;
    }

    const res = await api.post('/imports/timetable', {
      rawInput,
      format,
      sourceType,
      sourceAuthority,
      authorityLevel,
      targetType,
      targetScenarioId,
      targetScenarioName
    });
    return res.data;
  },

  /**
   * Retrieves import preview report
   */
  async getPreview(importId) {
    const res = await api.get(`/imports/${importId}/preview`);
    return res.data;
  },

  /**
   * Publishes verified import into target scenario
   */
  async publishImport(importId, { targetScenarioId, targetScenarioName } = {}) {
    const res = await api.post(`/imports/${importId}/publish`, {
      targetScenarioId,
      targetScenarioName
    });
    return res.data;
  },

  /**
   * Retrieves history of imports
   */
  async getHistory(limit = 50) {
    const res = await api.get(`/imports/history?limit=${limit}`);
    return res.data;
  },

  /**
   * Download export report
   */
  getExportUrl(importId, format = 'json') {
    return `/api/v1/imports/${importId}/export?format=${format}`;
  }
};

export default importApi;
