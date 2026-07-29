export interface CustomIconDefinition {
  viewBox?: string;
  paths: string[];
}

export const customIcons: Record<string, CustomIconDefinition> = {
  document: {
    viewBox: '0 0 24 24',
    paths: [
      'M4 3h10l6 6v12H4V3zm11 2.41V10h4.59L15 5.41z',
      'M7 8h5v2H7V8zm0 4h10v2H7v-2zm0 4h10v2H7v-2z',
    ],
  },
};
