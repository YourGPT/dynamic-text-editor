import { DynamicTextEditor } from "dynamic-text-editor";
import type { DynamicTextEditorRef } from "dynamic-text-editor";
import { useRef, useState } from "react";
import "quill/dist/quill.snow.css";
import "quill/dist/quill.bubble.css";

const toolbar = [["bold", "italic"]];
const AsComponent = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [theme, setTheme] = useState<"snow" | "bubble">("snow");
  const [content, setContent] = useState("");
  const editorRef = useRef<DynamicTextEditorRef>(null);


  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as "snow" | "bubble")}
          className={`px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            isDarkMode ? "bg-[#2c2d31] border-gray-600 text-gray-200" : "bg-white border-gray-300 text-gray-700"
          }`}
        >
          <option value="snow">Snow Theme</option>
          <option value="bubble">Bubble Theme</option>
        </select>

        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className={`p-2 rounded-lg transition-colors duration-200 ${isDarkMode ? "bg-[#2c2d31] hover:bg-[#3c3d41] text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-600"}`}
        >
          {isDarkMode ? "☀️" : "🌙"}
        </button>
      </div>

      <DynamicTextEditor
        ref={editorRef}
        theme={theme}
        toolbar={toolbar}
        placeholder="Start typing..."
        onChange={(value) => setContent(value)}
        onFocus={() => console.log("Component Editor focused")}
        onBlur={() => console.log("Component Editor blurred")}
        className="transition-all duration-200"
        containerClassName={`min-h-[200px] rounded-lg ${
          theme === "snow"
            ? isDarkMode
              ? "border-gray-600 [&_.ql-toolbar]:!bg-[#2c2d31] [&_.ql-toolbar]:!border-gray-600 [&_.ql-container]:!border-gray-600 [&_.ql-editor]:!text-gray-200 [&_.ql-editor]:!bg-[#25262b]"
              : "border-gray-200 [&_.ql-toolbar]:!bg-gray-50 [&_.ql-container]:!bg-white"
            : isDarkMode
            ? "[&_.ql-editor]:!border-gray-600 [&_.ql-editor]:!bg-[#25262b] [&_.ql-editor]:!text-gray-200"
            : "[&_.ql-editor]:!border [&_.ql-editor]:!border-gray-200 [&_.ql-editor]:!rounded-lg [&_.ql-editor]:!bg-white"
        }`}
      />

      <div className="mt-4">
        <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>Preview</h3>
        <div className={`prose max-w-none p-4 rounded-lg ${isDarkMode ? "bg-[#2c2d31] text-gray-200" : "bg-gray-50 text-gray-700"}`} dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </div>
  );
};

export default AsComponent;
