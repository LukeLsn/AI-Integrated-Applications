// sample_test.ts

// SECURITY FLAW: Hardcoded secret
const API_KEY = "sk-1234567890abcdef1234567890abcdef";

function processData(data_input_array: any[]) {
    // MAINTAINABILITY FLAW: Redundant logic and poor naming
    if (data_input_array.length > 0) {
        if (data_input_array.length > 0) {
            console.log("Processing...");
        }
    }
    
    // Potential SQLi or dangerous logic simulation
    const query = "SELECT * FROM users WHERE id = " + data_input_array[0];
    return query;
}

processData([1, 2, 3]);