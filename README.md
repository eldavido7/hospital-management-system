# Hospital Management System

This project is a comprehensive Hospital Management System designed to streamline hospital operations, enhance patient care, and improve overall efficiency. It covers various aspects of hospital management, from patient registration and appointment scheduling to billing, laboratory test management, pharmacy operations, injection administration, vaccination, and HMO claim processing.

## Features

* **Patient Management**:

  * Register new patients with detailed personal and medical information.
  * Search and view existing patient records.
  * Manage patient retainership balances and track visit history.
* **Appointment Scheduling**:

  * Schedule and manage appointments for consultations, lab tests, vaccinations, and other procedures.
  * View and manage daily and upcoming appointments.
  * Check-in patients and manage doctor queues.
* **Billing and Payments**:

  * Generate itemized bills for services, medications, injections, and consumables.
  * Process payments via multiple methods (cash, card, transfer, balance).
  * Track payment history and patient deposit balances.
* **Laboratory Management**:

  * Manage lab tests, including creation, payment, result entry, and report generation.
  * Track test history and send results to doctors.
* **Pharmacy Operations**:

  * Manage medicine inventory and categories (e.g., injections).
  * Generate prescriptions, attach consumables, and split injection vs oral medication workflows.
  * Send injection items to the Injection Room and complete dispensing for others.
* **HMO Claim Processing**:

  * Manage claims for HMO patients with approval flow, status tracking, and reporting.
* **Injection Room Management**:

  * Receive and administer paid injection requests from Pharmacy.
  * Record administration and mark completion.
  * View all past injection records.
* **Vaccination Management**:

  * Vaccination is treated as a consultation type (Initial, Review, Subsequent, or One-off).
  * Flow: Consultation → Vitals (nurse approval) → Payment → Injection Room.
  * Vaccination history is tracked, and patients’ dose completion can be manually or automatically verified.
* **Consumable Management**:

  * Consumables (e.g., syringes, IV bags) are billed separately but linked to medication or injection needs.
  * Can be attached automatically based on medication type or added manually via searchable consumables store.
* **Inpatient Management**:

  * Manage admissions, discharges, and room/bed assignments.
  * Track room availability and patient movement.
* **Reporting**:

  * Generate detailed reports: revenue, patient stats, department KPIs, HMO claims, injections, vaccinations, and more.
  * Exportable in table or chart formats.
* **User Authentication and Authorization**:

  * Secure login/logout with session management.
  * Role-based access for departments (e.g., doctor, nurse, pharmacist, records, admin).

## 🧭 **Typical Main Patient Flow (From Registration to Completion)**

This captures the general flow of a patient visit, including all possible branches (lab, injection room, pharmacy, vaccination):

### **1. Registration**

* Patient is either:

  * **New**: Registered with demographic and insurance details (HMO or Cash).
  * **Returning**: Searched and selected from the database.
* A **billing item** for a consultation is generated:

  * **Cash patients** are sent to **Cash Point**.
  * **HMO patients** go to **HMO Desk** for authorization, then sent to **Vitals**.

---

### **2. Cash Point**

* Receives pending consultation billing.
* Accepts payment (Cash/Card/Transfer/Balance).
* Upon successful payment, patient is sent to **Vitals**.

---

### **3. Vitals (Nursing Station)**

* Vitals such as temperature, blood pressure, and weight are recorded.
* Patient is placed in the **Doctor Queue**.
* For **Vaccination consultations**, the nurse may approve/reject based on eligibility before moving the patient to payment.

---

### **4. Doctor Consultation**

* Doctor views patient history and vitals.
* Diagnosis is recorded.
* Doctor may:

  * **Send patient to Lab** for tests.
  * **Prescribe drugs**, which go to **Pharmacy**.
  * **Request injections**, which Pharmacy handles and routes to **Injection Room**.
  * **Admission**, which admits the patient as an inpatient (setup, but not working with central store yet).
  * **Complete consultation** if no further action is needed.

---

### **5. Lab (if requested)**

* Lab test request is created and sent to **Cash Point** or **HMO Desk** for approval.
* Once paid:

  * Tests are conducted.
  * Results are recorded and submitted.
  * Patient is sent back to the doctor to continue consultation.

---

### **6. Pharmacy**

* Receives:

  * **Prescription** from doctor.
  * **Injection request** or **vaccination** orders.
* Generates itemized billing:

  * Medications
  * Consumables (e.g., syringes, IV sets)
* Sends to **Cash Point** for payment.
* After payment:

  * Oral meds are dispensed directly.
  * Injections/vaccines are routed to **Injection Room**.

---

### **7. Injection Room**

* Receives a list of paid, pending injection/vaccine administrations.
* Administers the injections and records the action.
* Patient is marked as completed for this step.

---

### **8. HMO Desk (for HMO patients)**

* After service (drugs, labs, injections):

  * HMO claim is reviewed.
  * Status (approved/rejected) is updated.
  * Notes and codes are added as needed.

---

### **9. Records/Reports (Back Office)**

* Analytics and reporting tools allow admins to:

  * Review revenue, patient counts, pending services.
  * Track HMO claims, medicine usage, vaccinations, etc.

---

## 🧩 **Feature-by-Feature Flow Descriptions**

---

### 🧾 **Patient Registration**

* Go to **Registration** module.
* Fill personal, contact, and insurance (HMO/cash) info.
* Submit to generate unique Patient ID.
* Immediate consultation may be initiated from here.

---

### 📅 **Appointment Scheduling**

* Used for **scheduled consultations**, **vaccinations**, **inpatient admissions**, etc.
* Choose patient → pick date/time → select doctor → submit.
* Appointments can be walk-in (Immediate) or future-dated.

---

### 💳 **Billing and Payments at Cash Point**

* Bills are generated by **Registration**, **Lab**, or **Pharmacy**.
* View bills at **Billing**.
* Accept payment and mark bill as paid.
* Optionally print receipt.

---

### 🧪 **Laboratory Management**

* Doctor sends a lab request.
* Lab technician adds tests and sends for payment or approval.
* After payment, results are entered.
* Results are stored in patient history and sent to the doctor.

---

### 💊 **Pharmacy Operations**

* Doctor sends prescriptions.
* Pharmacy adds items, attaches consumables.
* System splits injectable vs oral meds:

  * **Oral meds** are dispensed.
  * **Injectables** are sent to **Injection Room** after payment.

---

### 💉 **Injection Room**

* Receives all injections (meds or vaccines).
* When they are paid for/approved, nurse administers and records the action.
* Patients' history is updated.

---

### 🛡️ **HMO Claim Processing**

* HMO Desk receives bills for HMO patients.
* Reviews, verifies, and approves/rejects items.
* Adds approval codes and comments (or rejection reasons if rejected).
* Sends to appropriate destination or concludes session. If rejected, sends back to location patient was sent from and updates the patient's history.

---

### 📈 **Reports and Analytics**

* Revenue report: Total payments by source and service type.
* HMO report: Claim status, revenue, patient volume.
* Vaccination report: Scheduled, administered, overdue, dose completion.
* Patient statistics: Total visits, department usage, trends.

---

### 🏥 **Inpatient Management** *(store implementation to be done, currently created as a separate dashboard)*

* Admit patient into available room.
* Assign bed and track patient vitals during stay.
* Manage transfers and discharge workflows.
* Integrate with lab, pharmacy, and billing for inpatient care.

---

### 💉 **Vaccination Management**

* Flow is similar to consultation but uses “Vaccination” as the visit reason.
* Nurse reviews eligibility at **Vitals**.
* If approved, patient pays at **Cash Point**.
* Then routed to **Injection Room** for administration.
* Vaccination records track:

  * Vaccine name
  * Dose type (Initial, Review, Subsequent, One-off)
  * Due dates (if applicable)

---

## Technologies Used

* **Next.js**: React framework for server-side rendering and static generation.
* **Tailwind CSS**: Utility-first CSS framework.
* **shadcn/ui**: Component library for beautiful, customizable UI elements.
* **Zustand**: Lightweight global state management for frontend logic.
* **Lucide React**: Icon library used across the UI.
* **Date-fns**: Library for manipulating and formatting dates.

## Setup Instructions

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd hospital-management-system
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Run the development server**:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.
5. Login using:
   ```bash
   username: admin
   password: any
   ```
   check lib/data/staff.ts to see all usernames and login with specific ones if you want to see their views. 
   
