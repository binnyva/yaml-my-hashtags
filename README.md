# Yaml my Hashtags

This is an [Obsidian](https://obsidian.md) plugin to converts all the Hashtags(tags in the `#tag-name` format) in your note to a more standard YAML frontmatter format. 

## Usage

1. Install this plugin
2. Open note you want to convert
3. Press `Ctrl+P` to open Command Palette
4. Select/type 'Yaml my Hashtags: Convert Hashtags to YAML Frontmatter' option from the list.

Another option is just select the text which has the `#hashtags` and run the action. This will replace the hashtags within the selection itself - rather than editing the entire file.

#### Before...

```markdown
This is my note.

#sample #zettelkasten #permanant-note
```

#### After

```markdown
---
tags: ["sample", "zettelkasten", "permanant-note"]
---

This is my note
```
