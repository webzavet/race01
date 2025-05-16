import process from 'process';
import Backend from "./backend/Backend.js";

async function main() {
    const args = process.argv.slice(2);
    const success = await Backend.Run(args);
    if (!success) {
        console.error('Failed to start backend. Exiting.');
        process.exit(1);
    }
}

main().catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
});
