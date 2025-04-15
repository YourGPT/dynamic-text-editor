import { useState } from "react";
import { styled } from "styled-components";
import { CMEditor } from "./CMEditor";
import { defaultSuggestions } from "../utils/constants";

export const CMEditorDemo = () => {
  const [value, setValue] = useState("Hello {{username}},\n\nThank you for purchasing {{product}} for {{price}}.\nWe hope you enjoy your purchase!\n\nReaching us at {{email}} with any questions.\n\nRegards,\n{{company}}");

  const handleChange = (newValue: string) => {
    setValue(newValue);
  };

  const handleBlur = (e: any) => {
    console.log("Editor lost focus with value:", e.target.value);
  };

  return (
    <Container>
      <h1>CodeMirror Variable Editor Demo</h1>

      <InstructionsPanel>
        <Textarea value={value} onChange={(e) => setValue(e.target.value)} />
      </InstructionsPanel>

      <EditorWrapper>
        <CMEditor className="cmeditor" value={value} onChange={handleChange} suggestions={defaultSuggestions} placeholder="Enter your message here..." onBlur={handleBlur} />
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
