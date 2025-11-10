# **App Name**: Firestore Sizer

## Core Features:

- Field Input: Allow users to input field names and their data types (string, number, boolean, array, map).
- Data Type Size Calculation: Calculate the estimated size of each field based on the data type and input length/value.
- Multiplier Input: Allow users to specify a multiplier representing the number of documents with identical fields.
- Total Size Calculation: Calculate the estimated total size of all documents based on the field sizes and multiplier.
- Visual Size Display: Display the calculated size visually, such as a bar graph, showing how it relates to the Firestore document size limit of 1MB. The app acts as a tool to assist in database schema decisions.

## Style Guidelines:

- Primary color: Muted blue (#6699CC) to evoke a sense of trust and data focus.
- Background color: Light gray (#F0F0F0), a desaturated hue similar to the primary color, providing a clean and unobtrusive backdrop.
- Accent color: Soft orange (#FFA07A) to highlight key information and call to actions.
- Body and headline font: 'Inter', sans-serif, for clear and accessible data presentation.
- Clear sections for input fields, multiplier, and visual display.
- Simple, geometric icons for data types and actions.
- Subtle animations to smoothly update the visual size display.