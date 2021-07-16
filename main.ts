import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';
import * as matter from 'gray-matter';

interface YamlMyHashtagsSettings {
	singleLineTags: boolean;
	removeHashTags: boolean;
}

const DEFAULT_SETTINGS: YamlMyHashtagsSettings = {
	singleLineTags: true,
	removeHashTags: true
}

const uniqueArray = function(arr: any[]): any[] {
    for(var i=0; i<arr.length; ++i) {
        for(var j=i+1; j<arr.length; ++j) {
            if(arr[i] === arr[j])
                arr.splice(j--, 1);
        }
    }

    return arr;
}

export default class YamlMyHashtags extends Plugin {
	settings: YamlMyHashtagsSettings;

	async onload() {
		this.addCommand({
			id: 'convert-tags-to-yaml',
			name: 'Convert Hashtags to YAML Frontmatter',
			callback: async () => {
				await this.loadSettings();

				const noteFile = this.app.workspace.getActiveFile()
				const metadata = this.app.metadataCache.getFileCache(noteFile)
				
				if (noteFile.name) {
					// let leaf = this.app.workspace.activeLeaf;
					// const container = leaf.view?.containerEl;
					// let text = container.innerText; // getText() does not work
					let text = await this.app.vault.read(noteFile);

					let hashTagRegexp = /#([^\s#,]+)/g;
					const tagMatches = [...text.matchAll(hashTagRegexp)]
					const tags = tagMatches.map( ele => ele[1])

					if(!tags.length) return false; // No tags found

					const note = matter.parse(text) // Is function was added to the library by me.

					let newNote = text

					// For more options, go to https://github.com/nodeca/js-yaml#dump-object---options-
					const yamlOptions = {
						flowLevel: (this.settings.singleLineTags) ? 1 : -1, 
						forceQuotes: true, // if true this will quote everything
						// quotingType: '"',
						// styles: {
						// 	'!!timestamp': 'YYYY-MM-DD' // Does not work
						// },
					}
					if(matter.test(text)) {
						let frontmatter = note.data // We can use metadata.frontmatter too(?)
						if(frontmatter.tags) {
							frontmatter.tags = uniqueArray(frontmatter.tags.concat(tags))
						} else {
							frontmatter.tags = uniqueArray(tags)
						}

						newNote = matter.stringify(note.content, frontmatter, yamlOptions)

					} else {
						newNote = matter.stringify(text, {tags: uniqueArray(tags)}, yamlOptions)
					}

					// If setting is enabled, remove the hashtags.
					if(this.settings.removeHashTags) {
						for(let i in tags) {
							newNote = newNote.replace(`#${tags[i]}`, "")
						}
					}

					// Write the updated version to the file
					await this.app.vault.modify(noteFile, newNote);
					
					return true;
				}
				return false;
			}
		});

		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: YamlMyHashtags;

	constructor(app: App, plugin: YamlMyHashtags) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let {containerEl} = this;

		containerEl.empty();
		containerEl.createEl('h2', {text: 'Settings for Yaml My Tags'});

		new Setting(containerEl)
			.setName('Single Line Tag List')
			.setDesc('Do you want single line tags(tags: [tag-1,tag-2,tag-3]) or multi line tags?')
			.addToggle(text => text
				.setValue(true)
				.onChange(async (value) => {
					this.plugin.settings.singleLineTags = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Remove Hashtags after Converting')
			.setDesc('Remove hashtags from the text after moving them to the YAML frontmatter area?')
			.addToggle(text => text
				.setValue(true)
				.onChange(async (value) => {
					this.plugin.settings.removeHashTags = value;
					await this.plugin.saveSettings();
				}));
	}
}
