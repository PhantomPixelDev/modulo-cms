import react from '@vitejs/plugin-react';
import { moduloPlugin } from '../../../packages/plugin-sdk/index.js';

export default moduloPlugin({
    entry: 'tests/Fixtures/plugin-sdk/widget.tsx',
    outDir: 'storage/validation/plugin-sdk',
    plugins: [react()],
});
