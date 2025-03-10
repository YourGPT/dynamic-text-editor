# Dynamic Prompt Editor

A flexible and customizable prompt editor for React applications with variable suggestions and autocompletion.

🔗 [Live Demo](https://dynamic-prompt-editor.vercel.app)

## Features

- 🚀 Variable suggestions with customizable triggers
- ⌨️ Keyboard navigation
- 🎨 Custom styling support
- 🔧 Custom rendering capabilities
- 📝 Rich text editing powered by Draft.js

## Installation

```bash
npm install dynamic-prompt-editor
```

### Peer Dependencies

This library requires the following peer dependencies:

- react: ^16.8 || ^17.0 || ^18.0
- react-dom: ^16.8 || ^17.0 || ^18.0
- styled-components: ^6.0.0

If you haven't already, you'll need to install these in your project:

```bash
npm install styled-components
```

Note: React and React DOM are typically already installed in your project.

## Basic Usage

```tsx
import { DraftPromptEditor } from "dynamic-prompt-editor";

function App() {
  const [value, setValue] = useState("Hello {{VISITOR.name}}!");

  const suggestions = [
    {
      id: "visitor.name",
      label: "VISITOR.name",
      value: "VISITOR.name",
      category: "Visitor",
      description: "The visitor's full name",
    },
  ];

  return <DraftPromptEditor value={value} onChange={setValue} suggestions={suggestions} />;
}
```

## Props

| Prop                | Type                            | Required | Description                    |
| ------------------- | ------------------------------- | -------- | ------------------------------ |
| value               | string                          | Yes      | The editor content             |
| onChange            | (value: string) => void         | Yes      | Change handler                 |
| suggestions         | BaseEditorItem[]                | Yes      | Array of suggestion items      |
| placeholder         | string                          | No       | Editor placeholder             |
| className           | string                          | No       | Additional CSS class           |
| classNames          | EditorClassNames                | No       | Custom class names object      |
| renderItem          | (item, isSelected) => ReactNode | No       | Custom item renderer           |
| renderCategory      | (item) => ReactNode             | No       | Custom category renderer       |
| renderDescription   | (item) => ReactNode             | No       | Custom description renderer    |
| minSuggestionWidth  | number                          | No       | Min width of suggestion box    |
| maxSuggestionWidth  | number                          | No       | Max width of suggestion box    |
| maxSuggestionHeight | number                          | No       | Max height of suggestion box   |
| suggestionTrigger   | string                          | No       | Custom trigger (default: '{{') |
| suggestionClosing   | string                          | No       | Custom closing (default: '}}') |

## Examples

### Custom Styling

```tsx
<DraftPromptEditor
  value={value}
  onChange={setValue}
  suggestions={suggestions}
  classNames={{
    root: "custom-editor",
    editor: "custom-editor__input",
    variable: "custom-editor__variable",
    suggestions: "custom-editor__suggestions",
    suggestion: "custom-editor__suggestion",
    suggestionSelected: "custom-editor__suggestion--selected",
    category: "custom-editor__category",
    description: "custom-editor__description",
  }}
/>
```

### Custom Rendering

```tsx
const renderCustomItem = (item, isSelected) => (
  <div
    style={{
      padding: "8px",
      backgroundColor: isSelected ? "#f0f9ff" : "transparent",
    }}
  >
    <div style={{ fontWeight: "bold" }}>{item.label}</div>
    <div style={{ fontSize: "0.9em", color: "#666" }}>{item.description}</div>
  </div>
);

<DraftPromptEditor value={value} onChange={setValue} suggestions={suggestions} renderItem={renderCustomItem} />;
```

### Custom Triggers

```tsx
<DraftPromptEditor value={value} onChange={setValue} suggestions={suggestions} suggestionTrigger="${" suggestionClosing="}" />
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT
