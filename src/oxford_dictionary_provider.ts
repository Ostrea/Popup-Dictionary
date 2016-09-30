"use strict";


import { APP_ID, APP_KEY } from "./secrets";
import { Entry, Sense, VariantForm } from "./entry_classes";


const BASE_URL = "https://od-api.oxforddictionaries.com:443/api/v1/";


export function lookUpWord(word: string, region: string,
    populateTemplate: (word: string, region: string,
        entries: Entry[]) => void) {
    const lookUpUrl = BASE_URL + "entries/en/" + word.toLowerCase()
        + "/regions=" + region;

    const request = new XMLHttpRequest();
    request.open("GET", lookUpUrl);
    request.setRequestHeader("app_id", APP_ID);
    request.setRequestHeader("app_key", APP_KEY);

    request.onload = () => {
        if (request.status !== 200) {
            alert("Bad response from server. Status: " + request.status);
            return;
        }

        const entries = processJson(request.responseText);
        region = region === "us" ? "American" : "British";
        populateTemplate(word, region, entries);
    };
    request.onerror = () => {
        alert("Error when trying to send request!");
    };

    request.send();
}


function processJson(json: string): Entry[] {
    const rawEntries = JSON.parse(json).results[0].lexicalEntries;

    const allEntries: Entry[] = [];
    for (let sectionDefinition of rawEntries) {
        const partOfSpeech = sectionDefinition.lexicalCategory;

        let transitivity = undefined;
        if (sectionDefinition.grammaticalFeatures) {
            transitivity = sectionDefinition.grammaticalFeatures[0].text;
        }

        const linkToAudio = sectionDefinition.pronunciations.find(
            obj => obj.audioFile).audioFile;

        const entries = sectionDefinition.entries;

        for (let entry of entries) {
            const otherSpellings: VariantForm[] = [];
            otherSpellings.push.apply(otherSpellings, entry.variantForms);

            const rawSenses = entry.senses;
            const senses: Sense[] = [];
            for (let sense of rawSenses) {
                const definition: string = sense.definitions[0];
                const examples = sense.examples;

                let subSenses: Sense[] = undefined;
                if (sense.subsenses) {
                    subSenses = [];
                    for (let subSense of sense.subsenses) {
                        const definition: string = subSense.definitions[0];
                        const examples = subSense.examples;
                        const regions = subSense.regions;
                        subSenses.push(new Sense(definition, undefined,
                            regions));
                    }
                }

                senses.push(new Sense(definition, subSenses));
            }

            allEntries.push(new Entry(partOfSpeech, senses, linkToAudio,
                transitivity, otherSpellings));
        }
    }

    return allEntries;
}
