document.addEventListener("DOMContentLoaded", function () {
  // Initiate CodeMirror with syntax highlighting
  const editor = CodeMirror.fromTextArea(document.getElementById("code"), {
    mode: "python",
    theme: "material",
    lineNumbers: true,
    indentUnit: 4,
    smartIndent: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    lineWrapping: true,
    scrollbarStyle: "null",
    extraKeys: { "Ctrl-Space": "autocomplete" },
  });

  // Default Python code
  editor.setValue("print('hello,')");

  // Function to compile code with dynamic input handling
  async function compileCode() {
    const code = editor.getValue();
    const outputElement = document.getElementById("output");
    outputElement.textContent = "🔃 Running.....";

    // Check if input() calls are needed
    const inputPattern = /input\((?:'|"|')(.*?)(?:'|"|')\)/g;
    const inputPrompts = [...code.matchAll(inputPattern)].map(
      match => match[1]
    );

    if (inputPrompts.length > 0) {
      // Clear previous content
      outputElement.innerHTML = "<h3>Provide Inputs:</h3>";

      // Create a container for inputs
      const inputContainer = document.createElement("div");
      inputContainer.classList.add("input-container");

      inputPrompts.forEach((prompt, index) => {
        const inputGroup = document.createElement("div");
        inputGroup.classList.add("input-group");

        const label = document.createElement("label");
        label.setAttribute("for", `input-${index + 1}`);
        label.textContent = prompt;

        const input = document.createElement("input");
        input.setAttribute("type", "text");
        input.setAttribute("id", `input-${index + 1}`);
        input.classList.add("user-input");

        inputGroup.appendChild(label);
        inputGroup.appendChild(input);
        inputContainer.appendChild(inputGroup);
      });

      outputElement.appendChild(inputContainer);

      // Create and append the submit button
      const submitButton = document.createElement("button");
      submitButton.id = "submit-inputs-btn";
      submitButton.textContent = "Submit Inputs";
      outputElement.appendChild(submitButton);

      // Attach event listener to the submit button
      submitButton.addEventListener("click", submitInputs);
      return;
    }

    // If no inputs, execute directly
    await executeCode(code);
  }

  // Function to execute code
 async function executeCode(code, inputs = []) {
   const outputElement = document.getElementById("output");
   outputElement.textContent = "🔃 Running.....";
   console.log("Original code:", code); // Log original code
   console.log("Inputs provided:", inputs); // Log inputs

   // Replace input() calls with provided inputs
   let modifiedCode = code;
   let inputIndex = 0;
   modifiedCode = modifiedCode.replace(
     /input\((?:'|"|')(.*?)(?:'|"|')\)/g,
     () => {
       const replacement =
         inputs[inputIndex] !== undefined ? `"${inputs[inputIndex]}"` : '""';
       inputIndex++;
       return replacement;
     }
   );
   console.log("Modified code:", modifiedCode); // Log modified code

   try {
     const response = await fetch("https://emkc.org/api/v2/piston/execute", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({
         language: "python",
         version: "3.10.0",
         timeout: 5000,
         files: [{ content: modifiedCode }],
       }),
     });

     if (!response.ok) throw new Error("Error executing code!");
     const result = await response.json();
     console.log("API response:", result); // Log API response
     const output = result.run.output || "No output!";
     outputElement.innerHTML = `>${output}`;
   } catch (error) {
     outputElement.textContent = `Error: ${String(error)}`;
     console.error("Execution error:", error); // Log error
   }
 }

  // Collect inputs and retrun code
function submitInputs() {
  const inputs = Array.from(document.querySelectorAll(".user-input")).map(
    input => input.value
  );
  console.log("Collected inputs:", inputs); // Log collected inputs
  const code = editor.getValue();
  executeCode(code, inputs);
}
  // Add event listener to run code button (moved outside compileCode)
  const runButton = document.querySelector("#run-btn");
  runButton.addEventListener("click", compileCode);
});
