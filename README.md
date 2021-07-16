## Yaml my Hashtags

Converts all the Hashtags(tags in the `#tag-name` format) in your note to a more standard YAML frontmatter format. 

## Usage

1. Install this plugin
2. Open note you want to convert
3. Press `Ctrl+P` to open Command Palette
4. Select/type 'Yaml my Hashtags: Convert Hashtags to YAML Frontmatter' option from the list.

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
