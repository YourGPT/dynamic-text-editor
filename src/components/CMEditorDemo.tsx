import { useEffect, useState } from "react";
import { styled } from "styled-components";
import { CMEditor } from "./CMEditor";
import { defaultSuggestions } from "../utils/constants";

export const CMEditorDemo = () => {
  const [value, setValue] = useState("Hello {{username}},\n\nThank you for purchasing {{product}} for {{price}}.\nWe hope you enjoy your purchase!\n\nReaching us at {{email}} with any questions.\n\nRegards,\n{{company}}");
  const [value2, setValue2] = useState("Hello {{username}}, this is a single-line input");
  const [value3, setValue3] = useState("Hello {{username}}, try pressing Shift+Enter for a new line");

  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleChange = (newValue: string) => {
    console.log("newValue", newValue, countdown);
    setValue(newValue);
  };

  const handleChange2 = (newValue: string) => {
    setValue2(newValue);
  };

  const handleChange3 = (newValue: string) => {
    setValue3(newValue);
  };

  const handleBlur = (e: { target: { value: string } }) => {
    console.log("newValue", e, countdown);
    console.log("Editor lost focus with value:", e.target.value);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    console.log("keydown", e.key, e.shiftKey, countdown);
    if (e.key === "Enter" && !e.shiftKey) {
      // Prevent default for regular Enter (no shift key)
      e.preventDefault();
    }
    // Allow Enter+Shift to create new lines (by not preventing default)
  };

  return (
    <Container>
      <h1>CodeMirror Variable Editor Demo</h1>

      <InstructionsPanel>
        <Textarea value={value} onChange={(e) => setValue(e.target.value)} />
      </InstructionsPanel>
      {countdown}

      <h2>Multi-line Editor (default)</h2>
      <p>Press Shift+Enter for new line, Enter just submits</p>
      {/* <EditorWrapper> */}
      <CMEditor
        wordBreak
        className="cmeditor"
        value={value}
        onChange={handleChange}
        suggestions={defaultSuggestions}
        placeholder="Enter your message here..."
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        multiLine={true} // Explicitly set to true (the default)
      />
      {/* </EditorWrapper> */}

      <h2>Single-line Editor</h2>
      <p>Acts like a regular input field, Enter never creates new lines</p>
      <SingleLineWrapper>
        <CMEditor
          className="cmeditor single-line-demo"
          value={value2}
          onChange={handleChange2}
          suggestions={defaultSuggestions}
          placeholder="Single-line input"
          onBlur={handleBlur}
          multiLine={false} // Set to false for single-line behavior
        />
      </SingleLineWrapper>

      <h2>Multi-line with Custom Enter Handler</h2>
      <p>Same as first editor but shows the implementation</p>
      <EditorWrapper>
        <CMEditor className="cmeditor" value={value3} onChange={handleChange3} suggestions={defaultSuggestions} placeholder="Press Shift+Enter for new line" onBlur={handleBlur} onKeyDown={handleKeyDown} />
      </EditorWrapper>

      <OutputSection>
        <h3>Current Value:</h3>
        <pre>{value}</pre>
      </OutputSection>
    </Container>
  );
};

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;

  h1 {
    margin-bottom: 20px;
    color: #333;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  height: 200px;
  overflow-y: auto;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 10px;
`;
const InstructionsPanel = styled.div`
  background-color: #f8f9fa;
  border-left: 4px solid #1890ff;
  padding: 15px;
  margin-bottom: 20px;
  border-radius: 0 4px 4px 0;

  h3 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #1890ff;
  }

  code {
    background-color: #e6f7ff;
    padding: 2px 4px;
    border-radius: 3px;
    font-family: monospace;
  }

  ol {
    margin: 0;
    padding-left: 20px;
  }

  li {
    margin-bottom: 8px;
  }
`;

const EditorWrapper = styled.div`
  margin-bottom: 20px;
  border-radius: 4px;
  overflow: hidden;
  height: 300px;
`;

const SingleLineWrapper = styled.div`
  margin-bottom: 20px;
  overflow: hidden;
  height: 40px;
  min-height: 40px;
  max-height: 40px;
  /* border: 1px solid #ddd; */
  display: flex;
  align-items: center;

  .cmeditor {
    /* height: 40px; */
    min-height: 400px;
    /* max-height: 40px; */
    width: 100%;
    border-radius: 0px;
    /* Remove any potential margins or paddings */
    margin: 0;
    padding: 0;
  }

  /* Force single line mode appearance */
  .cm-editor {
    /* height: 40px;
    min-height: 40px;
    max-height: 40px; */

    .cm-line {
      height: 38px;
      line-height: 38px;
      padding: 0 !important;
    }
  }

  /* Explicitly position placeholder in single-line mode */
  .cm-placeholder {
    line-height: 38px;
    padding-left: 10px;
  }
`;

const OutputSection = styled.div`
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 20px;

  h3 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #333;
  }

  pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    background-color: #fff;
    padding: 10px;
    border-radius: 4px;
    border: 1px solid #eee;
  }
`;
