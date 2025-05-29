import * as fs from 'fs';
import * as path from 'path';

interface Config {
    port: number;
    dbUrl: string;
    logLevel: string;
}

const configPath = path.join(__dirname, '../../config/default.json');

const loadConfig = (): Config => {
    if (!fs.existsSync(configPath)) {
        throw new Error(`Configuration file not found at ${configPath}`);
    }
    const configFile = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(configFile) as Config;
};

const config = loadConfig();

export default config;