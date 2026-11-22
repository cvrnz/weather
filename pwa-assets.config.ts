import {defineConfig, minimal2023Preset as preset} from '@vite-pwa/assets-generator/config';

// The icon is a rounded tile; the maskable and Apple icons fill the padding around it with the tile's own color.
export default defineConfig({
  preset: {
    ...preset,
    maskable: {...preset.maskable, resizeOptions: {background: '#121212'}},
    apple: {...preset.apple, resizeOptions: {background: '#121212'}},
  },
  images: ['public/icon.svg'],
});
