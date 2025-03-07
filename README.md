# Dynamic Text Editor

A modern, flexible rich text editor for React applications, built on top of Quill.js. Provides both hook and component APIs for maximum flexibility.

https://github.com/user-attachments/assets/6a123004-ae15-43fd-893a-83759437b08b

## Features

- 🎨 Two beautiful themes (Snow & Bubble)
- 🌓 First-class dark mode support
- 🛠 Fully customizable toolbar
- 📱 Responsive & mobile-friendly
- 🎯 Written in TypeScript
- ⚡️ Lightweight & performant
- 🔄 Real-time content updates
- 🎮 Controlled & uncontrolled modes
- 📦 Zero configuration needed

## Quick Start

1. Install the package:

```bash
npm install dynamic-text-editor quill
# or
yarn add dynamic-text-editor quill
# or
pnpm add dynamic-text-editor quill
```

2. Import the styles:

```typescript
import "quill/dist/quill.snow.css";
import "quill/dist/quill.bubble.css";
```

3. Use it in your app:

```typescript
import { DynamicTextEditor } from "dynamic-text-editor";

function App() {
  return <DynamicTextEditor theme="snow" placeholder="Start typing..." onChange={(value) => console.log(value)} />;
}
```

## Local Development

Follow these steps to set up the project locally for development or testing:

### 1. Clone the repository

```bash
git clone https://github.com/konpeeyushDelta4/dynamic-text-editor.git
cd dynamic-text-editor
```

### 2. Set up the main library

```bash
# Install dependencies in the root directory
npm install
# or
yarn install
# or
pnpm install

# Build the library
npm run build
# or
yarn build
# or
pnpm build
```

### 3. Set up and run the test project

```bash
# Navigate to the test project
cd Dynamic-Text-Editor-Test

# Install dependencies
npm install
# or
yarn install
# or
pnpm install

# Start the development server
npm run dev
# or
yarn dev
# or
pnpm dev
```

Your test application should now be running at [http://localhost:5173](http://localhost:5173)

### 4. Running tests

```bash
# In the main library directory
npm test
# or
yarn test
# or
pnpm test

# In the test project directory
cd Dynamic-Text-Editor-Test
npm test
# or
yarn test
# or
pnpm test
```

### 5. Building for production

```bash
# Build the main library for production
npm run build
# or
yarn build
# or
pnpm build

# Build the test project for production
cd Dynamic-Text-Editor-Test
npm run build
# or
yarn build
# or
pnpm build
```

The production-ready files will be available in the `dist` directory.

### Project Structure

```
.
├── package.json            # Main package configuration
├── src/                    # Source code for the library
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
|   |---index               # 
│   └── styles/             # Basic CSS for default Editors
├── dist/                   # Built files (after running build)
|
├── example/                # Test application
│   ├── package.json        # Test app configuration
│   ├── src/                # Test app source code
│   │   ├── components/     # Test app components
│   │   │   └── use-case/   # Component and Hook usage examples
│   │   ├── App.tsx         # Main application component
│   │   └── main.tsx        # Entry point
│   ├── public/             # Static assets
│   └── dist/               # Built files for test app
└── README.md               # This file
```

## Component API

The package provides two ways to use the editor: as a component or as a hook.

### `<DynamicTextEditor />` Component

The component API provides a ready-to-use editor with all the bells and whistles.

```typescript
import { DynamicTextEditor } from "dynamic-text-editor";

function MyEditor() {
  return <DynamicTextEditor theme="snow" value="Initial content" onChange={(value) => console.log(value)} placeholder="Start typing..." readOnly={false} toolbar={[["bold", "italic"]]} />;
}
```

#### Props

| Prop                 | Type                      | Default         | Description                           |
| -------------------- | ------------------------- | --------------- | ------------------------------------- |
| `theme`              | `"snow"` \| `"bubble"`    | `"snow"`        | Editor theme                          |
| `value`              | `string`                  | `""`            | Editor content in HTML format         |
| `defaultValue`       | `string`                  | `""`            | Initial content (uncontrolled mode)   |
| `onChange`           | `(value: string) => void` | -               | Called when content changes           |
| `placeholder`        | `string`                  | `""`            | Placeholder text when editor is empty |
| `readOnly`           | `boolean`                 | `false`         | Makes the editor read-only            |
| `toolbar`            | `ToolbarConfig[]`         | Default toolbar | Customizes the toolbar options        |
| `className`          | `string`                  | `""`            | Class name for the editor wrapper     |
| `containerClassName` | `string`                  | `""`            | Class name for the container          |
| `onFocus`            | `() => void`              | -               | Called when editor gains focus        |
| `onBlur`             | `() => void`              | -               | Called when editor loses focus        |

### Hook API (`useDynamicTextEditor`)

The hook API provides more flexibility and control over the editor instance.

```typescript
import { useDynamicTextEditor } from "dynamic-text-editor";

function MyEditor() {
  const { quillRef, getValue, setValue } = useDynamicTextEditor({
    theme: "snow",
    onChange: (value) => console.log(value),
  });

  return (
    <>
      <div ref={quillRef} />
      <button onClick={() => console.log(getValue())}>Get Content</button>
    </>
  );
}
```

#### Hook Options

| Option         | Type                      | Default         | Description                  |
| -------------- | ------------------------- | --------------- | ---------------------------- |
| `theme`        | `"snow"` \| `"bubble"`    | `"snow"`        | Editor theme                 |
| `onChange`     | `(value: string) => void` | -               | Content change handler       |
| `value`        | `string`                  | `""`            | Controlled value             |
| `defaultValue` | `string`                  | `""`            | Initial value (uncontrolled) |
| `placeholder`  | `string`                  | `""`            | Placeholder text             |
| `toolbar`      | `ToolbarConfig[]`         | Default toolbar | Toolbar configuration        |
| `onFocus`      | `() => void`              | -               | Focus handler                |
| `onBlur`       | `() => void`              | -               | Blur handler                 |

#### Return Value

| Property   | Type                      | Description                     |
| ---------- | ------------------------- | ------------------------------- |
| `quillRef` | `RefObject`               | Ref to attach to your container |
| `getValue` | `() => string`            | Get current editor content      |
| `setValue` | `(value: string) => void` | Set editor content              |
| `clear`    | `() => void`              | Clear editor content            |
| `focus`    | `() => void`              | Focus the editor                |
| `blur`     | `() => void`              | Blur the editor                 |

## Toolbar Configuration

The toolbar can be customized using the `toolbar` prop. Here are all available options:

```typescript
const FULL_TOOLBAR = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  ["bold", "italic", "underline", "strike"],
  [{ color: [] }, { background: [] }],
  [{ script: "sub" }, { script: "super" }],
  [{ list: "ordered" }, { list: "bullet" }],
  [{ indent: "-1" }, { indent: "+1" }],
  [{ direction: "rtl" }],
  [{ align: [] }],
  ["link", "image", "video"],
  ["clean"],
];

// Usage
<DynamicTextEditor toolbar={FULL_TOOLBAR} />;
```

### Common Toolbar Configurations

1. **Basic Text Formatting**

```typescript
const basicToolbar = [["bold", "italic", "underline"]];
```

2. **Rich Text Features**

```typescript
const richToolbar = [["bold", "italic"], [{ header: [1, 2, false] }], ["link", "image"]];
```

3. **Content Organization**

```typescript
const organizationToolbar = [[{ header: [1, 2, 3, false] }], [{ list: "ordered" }, { list: "bullet" }], [{ align: [] }]];
```

## Styling

### Theme-based Styling

The editor supports both Snow and Bubble themes with dark mode:

```typescript
// Snow theme with dark mode
<DynamicTextEditor
  theme="snow"
  containerClassName={`
    min-h-[200px] rounded-lg
    ${isDarkMode
      ? "border-gray-600 [&_.ql-toolbar]:!bg-[#2c2d31] [&_.ql-toolbar]:!border-gray-600 [&_.ql-container]:!border-gray-600 [&_.ql-editor]:!text-gray-200 [&_.ql-editor]:!bg-[#25262b]"
      : "border-gray-200 [&_.ql-toolbar]:!bg-gray-50 [&_.ql-container]:!bg-white"
    }
  `}
/>

// Bubble theme with dark mode
<DynamicTextEditor
  theme="bubble"
  containerClassName={`
    min-h-[200px] rounded-lg
    ${isDarkMode
      ? "[&_.ql-editor]:!border-gray-600 [&_.ql-editor]:!bg-[#25262b] [&_.ql-editor]:!text-gray-200"
      : "[&_.ql-editor]:!border [&_.ql-editor]:!border-gray-200 [&_.ql-editor]:!rounded-lg [&_.ql-editor]:!bg-white"
    }
  `}
/>
```

### Custom CSS Variables

You can customize the editor's appearance using CSS variables:

```css
.dynamic-text-editor {
  --dte-primary-color: #007aff;
  --dte-border-radius: 8px;
  --dte-toolbar-bg: #f8f9fa;
  --dte-editor-bg: #ffffff;
  --dte-text-color: #2c3e50;
  --dte-placeholder-color: #a0aec0;
}
```

## Examples

### 1. Basic Usage

```typescript
function BasicEditor() {
  return <DynamicTextEditor theme="snow" placeholder="Start typing..." onChange={(value) => console.log(value)} />;
}
```

### 2. Controlled Editor

```typescript
function ControlledEditor() {
  const [content, setContent] = useState("");

  return <DynamicTextEditor value={content} onChange={setContent} theme="snow" />;
}
```

### 3. Custom Toolbar with Hook

```typescript
function CustomEditor() {
  const { quillRef } = useDynamicTextEditor({
    theme: "snow",
    toolbar: [["bold", "italic"], [{ header: [1, 2, false] }]],
    onChange: (value) => console.log(value),
  });

  return <div ref={quillRef} className="min-h-[200px]" />;
}
```

### 4. Read-only Mode

```typescript
function ReadOnlyEditor() {
  return <DynamicTextEditor readOnly value="<p>This content cannot be edited</p>" theme="bubble" />;
}
```

## TypeScript Support

The package includes comprehensive TypeScript definitions. Here are some common types:

```typescript
type Theme = "snow" | "bubble";

interface ToolbarConfig {
  header?: (1 | 2 | 3 | 4 | 5 | 6 | false)[];
  bold?: boolean;
  italic?: boolean;
  // ... other toolbar options
}

interface DynamicTextEditorProps {
  theme?: Theme;
  value?: string;
  onChange?: (value: string) => void;
  // ... other props
}
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- IE 11 (with polyfills)
