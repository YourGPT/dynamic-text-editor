const skipLint = process.env.SKIP_LINT === "true";

async function build() {
  if (!skipLint) {
    // Run linting
    console.log("Running linting...");
    // Your linting code here
  } else {
    console.log("Skipping linting...");
  }

  // Continue with the rest of your build process
  // ...
}

build();
