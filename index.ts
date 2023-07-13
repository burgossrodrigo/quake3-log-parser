import fs from 'fs';

const filePath = './quake3.log';

interface LogEntry {
    timestamp: string;
    type: string;
    message: string;
}

export interface ResEntry {
    [key: string]: ResData;
}

interface ResData {
    total_kills: number
    players: string[]
    kills: {
        [player: string]: number;
    }
    kills_by_means: {
        [means: string]: number;
    }
}

const formatKill = (message: string, resEntries: ResEntry[]) => {
    if (message.includes('<world>')) {
        const newEntryKey: string = `game_${resEntries.length}`;
        const currentEntry = resEntries[resEntries.length - 1][newEntryKey];

        if (currentEntry) {
            const killer = handleMurder(message); // Get the name of the killer
            const kills = currentEntry.kills;
            kills[killer] = (kills[killer] || 0) - 1; // Increment the kill count for the killer
            currentEntry.total_kills += 1;

            const causeOfDeath = handleCauseOfDeath(message); // Get the cause of death
            const killsByMeans = currentEntry.kills_by_means;
            killsByMeans[causeOfDeath] = (killsByMeans[causeOfDeath] || 0) + 1; // Increment the kill count by means
        }
    } else {
        const newEntryKey: string = `game_${resEntries.length}`;
        const currentEntry = resEntries[resEntries.length - 1][newEntryKey];

        if (currentEntry) {
            const killer = handleMurder(message); // Get the name of the killer
            const kills = currentEntry.kills;
            kills[killer] = (kills[killer] || 0) + 1; // Increment the kill count for the killer
            currentEntry.total_kills += 1; // Increment the total kill count

            const causeOfDeath = handleCauseOfDeath(message); // Get the cause of death
            const killsByMeans = currentEntry.kills_by_means;
            killsByMeans[causeOfDeath] = (killsByMeans[causeOfDeath] || 0) + 1; // Increment the kill count by means
        }
    }
};


const handleMurder = (message: string): string | any => {
    console.log(message)
    if (message.includes('<world>')) {
        const regex = /killed\s+(.+?)\s+by/; // Updated regular expression pattern
        const match = message.match(regex); // Perform the match

        if (match) {
            const killedPlayer = match[1]; // Extract the matched word
            return killedPlayer; // Output: Dono da Bola
        }
    } else {
        const parts = message.split(' ');
        const killer = parts[3]; // The killer's name is at index 3 in the parts array
        return killer;
    }
};

const handleCauseOfDeath = (message: string) => {
    const words = message.split(' ');
    const causeOfDeath = words[words.length - 1];
    console.log(causeOfDeath, 'causeofDeath')
    return causeOfDeath
}

const handleNewClient = (message: string, resEntries: ResEntry[]) => {
    const startIndex = message.indexOf('n\\') + 2; // Adding 2 to skip 'n\'
    const nextWord = message.substring(startIndex).split('\\')[0];
    const newEntryKey: string = `game_${resEntries.length}`;

    const currentEntry = resEntries[resEntries.length - 1][newEntryKey];

    if (currentEntry && !currentEntry.players.includes(nextWord)) {
        currentEntry.players.push(nextWord);
    }

    // Remove duplicates from players array
    currentEntry.players = [...new Set(currentEntry.players)];

    console.log(resEntries);
};

const parseLogEntries = (): LogEntry[] | any => {
    try {
        const data = fs.readFileSync(filePath, 'utf-8');
        // Process the file data
        let logContent = data;
        const logEntries = logContent.split('\n'); // Split into log entries
        const parsedLogs: LogEntry[] = [];

        for (const entry of logEntries) {
            let parts = entry.split(' ').map((part) => part.trim())
            const withoutSpace = parts.filter((str: string) => { return str !== '' })
            const timestamp = withoutSpace[0]
            const type = withoutSpace[1]
            const message = withoutSpace.slice(2).join(' ')

            const logEntry: LogEntry = {
                timestamp,
                type,
                message
            };

            parsedLogs.push(logEntry);
        }

        return parsedLogs
    } catch (err) {
        console.error('Error reading file:', err);
    }
};

export const handleLogEntries = () => {
    const resEntries: ResEntry[] = [];
    const parsedEntries = parseLogEntries();
    console.log(parsedEntries);

    for (const entry of parsedEntries) {
        let newEntryKey;

        switch (entry.type) {
            case 'InitGame:':
                newEntryKey = `game_${resEntries.length + 1}`;
                const newEntry: ResEntry = {
                    [newEntryKey]: {
                        total_kills: 0,
                        players: [],
                        kills: {},
                        kills_by_means: {}
                    }
                };
                resEntries.push(newEntry);
                break; // Add break statement here

            case 'Kill:':
                formatKill(entry.message, resEntries);
                break; // Add break statement here

            // Add more cases for other log entry types
            case 'ClientUserinfoChanged:':
                handleNewClient(entry.message, resEntries)
                break;

            default:
                // Handle other log entry types
                break;
        }
    }

    return JSON.stringify(resEntries)
}

console.log(handleLogEntries())

