import { useState } from "react";
import { styled } from "styled-components";
import { CMEditor } from "./CMEditor";

const demoSuggestions = [
  { value: "username", label: "Username", description: "User's full name", link: "https://example.com/user-docs" },
  { value: "email", label: "Email", description: "User's email address" },
  { value: "product", label: "Product", description: "Product name", link: "https://example.com/products" },
  { value: "price", label: "Price", description: "Product price" },
  { value: "date", label: "Date", description: "Current date", link: "https://example.com/date-format" },
  { value: "company", label: "Company", description: "Company name" },
  { value: "phone", label: "Phone", description: "Customer phone number" },
  { value: "address", label: "Address", description: "Shipping address", link: "https://example.com/address-format" },
  { value: "orderId", label: "Order ID", description: "Unique order identifier" },
  { value: "creditCard", label: "Credit Card", description: "Credit card type" },
];

export const CMEditorDemo = () => {
  const [value, setValue] = useState("Hello {{username}},\n\nThank you for purchasing {{product}} for {{price}}.\nWe hope you enjoy your purchase!\n\nReaching us at {{email}} with any questions.\n\nRegards,\n{{company}}");

  const handleChange = (newValue: string) => {
    setValue(newValue);
  };

  return (
    <Container>
      <h1>CodeMirror Variable Editor Demo</h1>

      <InstructionsPanel>
        <Textarea value={value} onChange={(e) => setValue(e.target.value)} />
      </InstructionsPanel>

      <EditorWrapper>
        <CMEditor value={value} onChange={handleChange} suggestions={demoSuggestions} />
      </EditorWrapper>

      <OutputSection>
        <h3>Current Value:</h3>
        <pre>{value}</pre>
      </OutputSection>

      <VariablesSection>
        <h3>Available Variables:</h3>
        <ul>
          {demoSuggestions.map((suggestion) => (
            <li key={suggestion.value}>
              <strong>{`{{${suggestion.value}}}`}</strong>: {suggestion.description}
              {suggestion.link && (
                <span className="variable-link">
                  <a href={suggestion.link} target="_blank" rel="noopener noreferrer">
                    {suggestion.link}
                  </a>
                </span>
              )}
            </li>
          ))}
        </ul>
      </VariablesSection>
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

const VariablesSection = styled.div`
  background-color: #e6f7ff;
  border-radius: 4px;
  padding: 15px;

  h3 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #1890ff;
  }

  ul {
    margin: 0;
    padding-left: 20px;
  }

  li {
    margin-bottom: 10px;
  }

  strong {
    color: #1890ff;
  }

  .variable-link {
    display: block;
    font-size: 12px;
    margin-top: 3px;

    a {
      color: #1890ff;
      text-decoration: underline;
    }
  }
`;
