import { App, Plugin, PluginSettingTab, Setting, MarkdownView } from 'obsidian';
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
			callback: () => this.convertTags()
		});

		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	async convertTags() {
		await this.loadSettings();

		const noteFile = this.app.workspace.getActiveFile();
		if(!noteFile.name) return;

		const metadata = this.app.metadataCache.getFileCache(noteFile);
		const editor =  this.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
		const selectedText = editor.getSelection();
		const selectedCursor = editor.getCursor();

		console.log(selectedText, selectedCursor)

		return;

		// Get contents of note...
		// let leaf = this.app.workspace.activeLeaf;
		// const container = leaf.view?.containerEl;
		// let text = container.innerText; // getText() does not work
		let text = await this.app.vault.read(noteFile);

		let hashTagRegexp = /#([^\s#,]+)/g; // Regexp that will match hashtags

		let selectedFrom = selectedCursor.from;
		let selectedTo = selectedCursor.to;
		// Selections from to don't have to be in order. So swap if that's the case
		if(selectedCursor.from.line > selectedCursor.to.line || selectedCursor.from.ch > selectedCursor.to.ch) {
			selectedFrom = selectedCursor.to;
			selectedTo = selectedCursor.from;
		}

		// Text is selected
		if(selectedFrom.ch !== selectedTo.ch || selectedFrom.line !== selectedTo.line) {
			const lines = text.split("\n");
			let selectedText = "";

			if(selectedFrom.line === selectedTo.line) { // Single line selection.
				selectedText = lines[selectedFrom.line].substring(selectedFrom.ch, selectedTo.ch)
			} else {
				selectedText = lines[selectedFrom.line].substring(selectedFrom.ch) + "\n"; // First line of the selection.
				for(let i=selectedFrom.line+1; i<selectedTo.line; i++) {
					selectedText += lines[i] + "\n";
				}
				selectedText += lines[selectedTo.line].substring(0, selectedTo.ch); // List line
			}

			const tagMatches = [...text.matchAll(hashTagRegexp)]
			let tags = tagMatches.map( ele => ele[1] )

			if(!tags.length) return false; // No tags found
			tags = uniqueArray(tags)

			let newText = selectedText

			if(this.settings.removeHashTags) {
				for(let i in tags) {
					newText = newText.replace(`#${tags[i]}`, "")
				}
			}

			const tagsList = JSON.stringify(tags).replace(/[\[\]]/g, ""); // We don't need the [] part of the array
			newText = newText.substring(0, tagMatches[0].index) + tagsList + newText.substring(tagMatches[0].index)

			console.log(newText)


		} else {
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
