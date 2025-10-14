import AsyncStorage from '@react-native-async-storage/async-storage';
  // Normalize date input to YYYY-MM-DD if possible\n  private normalizeDate(input: string): string {\n    try {\n      if (/^\\d{4}-\\d{2}-\\d{2}$/.test(input)) return input;\n      const m = input.match(/^(\\d{1,2})\\/(\\d{1,2})\\/(\\d{4})$/);\n      if (m) {\n        const d = m[1].padStart(2, '0');\n        const mo = m[2].padStart(2, '0');\n        const y = m[3];\n        return ${y}--;\n      }\n      const dt = new Date(input);\n      if (!isNaN(dt.getTime())) {\n        const y = dt.getFullYear();\n        const mo = String(dt.getMonth() + 1).padStart(2, '0');\n        const d = String(dt.getDate()).padStart(2, '0');\n        return ${y}--;\n      }\n      return input;\n    } catch {\n      return input;\n    }\n  }\n}\n\nexport default new CalendarService();

  // Clear all items
  public async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      console.log('All calendar items cleared');
    } catch (error) {
      console.error('Failed to clear calendar items:', error);
      throw error;
    }
  }

  // Normalize date input to YYYY-MM-DD if possible
  private normalizeDate(input: string): string {
    try {
      // If already YYYY-MM-DD, keep it
      if (/^\\d{4}-\\d{2}-\\d{2}$/.test(input)) return input;
      // Convert DD/MM/YYYY to YYYY-MM-DD
      const m = input.match(/^(\\d{1,2})\\/(\\d{1,2})\\/(\\d{4})$/);
      if (m) {
        const d = m[1].padStart(2, '0');
        const mo = m[2].padStart(2, '0');
        const y = m[3];
        return ${y}--;
      }
      // Fallback to Date parsing
      const dt = new Date(input);
      if (!isNaN(dt.getTime())) {
        const y = dt.getFullYear();
        const mo = String(dt.getMonth() + 1).padStart(2, '0');
        const d = String(dt.getDate()).padStart(2, '0');
        return ${y}--;
      }
      return input;
    } catch {
      return input;
    }
  }
}

export default new CalendarService();
