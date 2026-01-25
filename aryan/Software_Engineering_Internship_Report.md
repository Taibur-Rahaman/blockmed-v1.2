Department of Electrical and Computer Engineering

North South University

Directed Research

Software Engineering Internship at FlyMek Drone Manufacturing

Kazi Eraj Al Minhaj Turjo          ID# 183106642

Faculty Advisor:

Dr. ASM Jahid Hasan

Assistant Professor

ECE Department

Fall, 2025

APPROVAL

Kazi Eraj Al Minhaj Turjo (ID # 183106642) from Electrical and Computer Engineering Department of North South University has worked on the Directed Research Project titled “Software Engineering Internship at FlyMek Drone Manufacturing” under the supervision of Dr. ASM Jahid Hasan for partial fulfillment of the requirement for the degree of Bachelor of Science in Engineering and has been accepted as satisfactory.

Supervisor’s Signature

…………………………………….

Dr. ASM Jahid Hasan

Assistant Professor

Department of Electrical and Computer Engineering

North South University

Dhaka, Bangladesh.

Chairman’s Signature

…………………………………….

Dr. Rajesh Palit

Professor

Department of Electrical and Computer Engineering

North South University

Dhaka, Bangladesh.

DECLARATION

This is to declare that this project/directed research is my original work. No part of this work has been submitted elsewhere partially or fully for the award of any other degree or diploma. All project related information will remain confidential and shall not be disclosed without the formal consent of the project supervisor. Relevant previous works presented in this report have been properly acknowledged and cited. The plagiarism policy, as stated by the supervisor, has been maintained.

Student’s name & Signature

1. Kazi Eraj Al Minhaj Turjo

_ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ _

ACKNOWLEDGEMENTS

I would like to express my heartfelt gratitude to my project and research supervisor, Dr. ASM Jahid Hasan, Assistant Professor, Department of Electrical and Computer Engineering, North South University, Bangladesh, for his invaluable support, precise guidance and advice during the internship and in the preparation of this report.

I also thank the Department of Electrical and Computer Engineering, North South University, for facilitating the internship, and my site supervisor and engineering team at FlyMek Drone Manufacturing for their guidance and cooperation. Thanks to my colleagues for their continuous help and to my family and friends for their constant support.

ABSTRACT

This report presents my internship experience at FlyMek Drone Manufacturing as a Software Engineering Intern in the Information Technology department from 14 September 2025 to 15 December 2025. The work focused on internal software systems used for drone testing, control, and data monitoring. I assisted in developing and maintaining internal tools, supported MAVLink protocol integration, contributed to UI/UX improvements for ground control applications including QGroundControl, and worked with automation scripts and real-time data monitoring systems. I also participated in troubleshooting hardware–software interaction issues. The structured internship process under senior engineers provided practical exposure to telemetry data handling, system integration, and UI/UX design for drone operations. Results included clearer understanding of telemetry workflows, improved UI clarity, and validated automation/monitoring practices. The experience strengthened technical skills, teamwork, and documentation discipline, demonstrating that reliable drone operation depends on well-maintained software systems and effective hardware–software integration.

TABLE OF CONTENTS

LETTER OF TRANSMITTAL	 ii

APPROVAL	 iv

DECLARATION	 v

ACKNOWLEDGEMENTS	 vi

ABSTRACT	 vii

TABLE OF CONTENTS	 viii

LIST OF FIGURES	 x

LIST OF TABLES	 xi

Chapter 1 Introduction	 1

1.1 Background and Motivation	 1

1.2 Purpose and Goal of the Project	 2

1.3 Organization of the Report	 2

Chapter 2 Research Literature Review	 3

2.1 Existing Research and Limitations	 3

Chapter 3 Methodology	 5

3.1 System Design	 5

3.2 Hardware and/or Software Components	 6

3.3 Hardware and/or Software Implementation	 7

Chapter 4 Investigation/Experiment, Result, Analysis and Discussion	 9

Chapter 5 Conclusions	 12

5.1 Summary	 12

5.2 Limitations	 13

5.3 Future Improvement	 13

References	 15

LIST OF FIGURES

Figure 1. Simplified system architecture for ground control and telemetry (conceptual)

LIST OF TABLES

Table I. Software/Hardware tools used during internship

Chapter 1 Introduction

1.1 Background and Motivation

Unmanned Aerial Vehicles (UAVs) are increasingly used for surveying, inspection, monitoring, and data collection. Reliable UAV operations depend on tightly integrated hardware and software that ensure stable communication, control, and data processing. Ground control software, telemetry handling, UI/UX design, and automation are critical components that directly affect operator effectiveness and system reliability. The internship was motivated by the need to gain practical exposure to these software aspects of drone systems and to see how classroom concepts translate into industrial practice.

1.2 Purpose and Goal of the Project

The internship aimed to gain hands-on software engineering experience within a drone technology company. Goals included:
- Assist in development and maintenance of internal software systems for testing and monitoring
- Support MAVLink communication integration and telemetry workflows
- Contribute to UI/UX enhancements for ground control software (e.g., QGroundControl)
- Work with automation scripts and real-time data monitoring systems
- Strengthen professional skills in teamwork, communication, and documentation

Scope was limited to supporting internal tools, interfaces, data handling, and system support tasks; flight-critical firmware development was outside scope.

1.3 Organization of the Report

Chapter 1 introduces motivation, goals, and structure. Chapter 2 reviews relevant literature and industry context for drone software systems, ground control, and MAVLink communication. Chapter 3 details methodology: system design, components, and implementation activities. Chapter 4 presents investigations, results, analyses, and discussions. Chapter 5 concludes with summary, limitations, and future improvements. References list cited sources.

Chapter 2 Research Literature Review

2.1 Existing Research and Limitations

Brain tumors are abnormal proliferations of cells that may be benign or malignant. Symptoms vary by tumor type, size, and location (e.g., headaches, seizures, speech or vision changes, nausea, vomiting, balance issues). MRI is the primary imaging modality for localization, and segmentation is essential for diagnosis, growth tracking, and treatment planning. Manual segmentation is time-consuming and variable, motivating automated methods.

Early statistical and atlas-based approaches tackled appearance variability. A multi-fractal Brownian model extracted multi-scale stochastic features to differentiate tumor and non-tumor tissue on MRI and surpassed prior methods in accuracy and speed on pediatric cases [1]. Atlas adaptation with registration plus tumor-growth simulation enabled implicit segmentation by warping a healthy atlas to patient MRI, improving mapping of tumors and subcortical structures for radiotherapy planning [2]. Contour-model plus random forest methods combined boundary evolution with learned local/context features to segment gliomas accurately and efficiently [3].

Deep learning methods dominate recent work. Dense 3D CNNs with residual connections and hard-example mining improved Dice scores on volumetric tumor segmentation [4]. 3D U-Net variants (e.g., BraTS competition systems) used patching and brain-wise normalization to reduce GPU demand while preserving accuracy [5]. Bayesian classification with multilevel processing targeted glioblastoma multiforme (GBM) for robust delineation [6]. Reviews surveying MRI brain-tumor segmentation summarize classical ML (thresholding, region growing, SVM) and modern CNN/U-Net families, noting evaluation metrics and clinical utility [7]. Multi-view dynamic fusion networks with fusion loss and deep decision fusion achieved strong performance across datasets [8]. Longitudinal surveys report steady accuracy gains from 2012–2018, supporting automated segmentation as a practical clinical aid [9].

Other machine-learning innovations include LIPC+SVM frameworks achieving high accuracy for whole/enhancing/core regions [10] and Tumor-Cut (cellular automata on contrast-enhanced MRI) showing strong delineation across 20 patients [11]. Linear-programming tumor-boundary estimation refined via optimal mass transport produced accurate boundary predictions useful for radiotherapy planning [12]. Modified U-Nets with class-imbalance correction and augmentation reached state-of-the-art on BRATS datasets and incorporated survival prediction via radiomics plus random-forest/MLP regressors [13]. Additional CNN-based methods with aggressive augmentation further improved generalization on labeled MRI tumor datasets [14].

Encoder–decoder designs remain central. ZNet (skip connections, encoder–decoder, dice loss) improved 2D MRI segmentation accuracy and F1/Dice, with suggested extension to 3D volumes [15]. Volumetric architectures leveraging multi-modal MRI with feature alignment and cross-modality interaction increased accuracy and consistency of 3D segmentations [16]. Reviews emphasize integrating complementary modalities and enforcing consistency for higher-quality segmentations.

Broader semantic-segmentation advances inform medical imaging. Surveys chart progress across FCN/CRF, dilated convolutions, backbone evolution, pyramid methods, multi-level/multi-stage pipelines, and supervision regimes [17]. ICNet accelerated inference via multi-resolution fusion, balancing speed and accuracy for real-time tasks [18]. Comparative studies of U-Net variants (e.g., R2 U-Net, Dense U-Net) found deeper three-layer variants delivered superior Dice on dental X-rays, highlighting architectural trade-offs [19]. SegFormer introduced a hierarchical transformer encoder with lightweight MLP decoder, achieving strong zero-shot robustness while avoiding positional encodings; edge deployment constraints remain open [20]. Compound scaling (EfficientNet) balanced width, depth, and resolution to boost accuracy with fewer parameters, suggesting efficient backbones for medical segmentation [21].

Overall, the literature shows a progression from atlas/statistical models to specialized CNN/transformer architectures. Persistent challenges include class imbalance, heterogeneity of tumor appearance, limited annotated data, and computational cost. Promising directions involve multi-modal fusion, efficient architectures for edge devices, robust augmentation, and better handling of rare tumor subtypes.

Chapter 3 Methodology

3.1 System Design

The internship work centered on an internal ecosystem:
- Drone hardware transmitting telemetry via MAVLink
- Ground control software (e.g., QGroundControl) for mission control and visualization
- Data processing and monitoring services for logging and analysis
- Automation scripts to streamline testing and data handling
- UI/UX layers for operator-facing dashboards

Data flow: UAV → MAVLink comms → ground control app → processing/monitoring → operator UI; automation scripts assist testing and validation.

3.2 Hardware and/or Software Components

Table I. Software/Hardware tools used during internship

| Tool | Functions | Other similar tools | Why selected |
|------|-----------|---------------------|---------------|
| QGroundControl | Ground control, mission planning, telemetry display | Mission Planner, APM Planner | Widely used, open source, feature-rich |
| MAVLink | Telemetry/command protocol | Custom protocols, ROS msgs | Standard, well-documented, broad ecosystem |
| Internal software systems | Testing, monitoring, data processing | Custom in-house tools | Fit specific ops needs |
| Automation scripts (Python/bash) | Test automation, data processing | Other scripting langs | Fast iteration, easy integration |
| Documentation tools | Progress and knowledge capture | Various platforms | Standard practice |

Hardware: UAV platforms, radio/telemetry modules, workstations, and test rigs used for integration and validation.

3.3 Hardware and/or Software Implementation

- Tool maintenance and fixes: resolved minor issues, supported feature tweaks, verified behaviors.
- MAVLink integration support: observed telemetry parsing, synchronization, and error behaviors; assisted in testing communication flows.
- UI/UX improvements: reorganized layouts, improved data grouping and prioritization, validated responsiveness and readability.
- Automation and monitoring: enhanced/created scripts for data logging and performance checks; verified real-time streams.
- Testing: functional and integration tests to ensure changes did not regress system behavior; documented findings and steps.

Chapter 4 Investigation/Experiment, Result, Analysis and Discussion

Investigations focused on telemetry workflows, UI/UX effectiveness, and automation reliability.

- Telemetry handling: observed end-to-end flow; found that synchronization and consistency are critical to operator trust. Communication delays or parsing issues directly affect situational awareness.
- MAVLink support: verified message handling in ground control; noted importance of robust error handling and configuration for reliable data.
- UI/UX enhancements: layout/grouping changes improved clarity; operators could identify critical fields faster, reducing confusion during tests.
- Automation and monitoring: scripts reduced manual effort and improved repeatability; accurate logging was essential for performance assessment.
- Integration testing: ensured ground control, protocol layer, and monitoring tools worked cohesively; attention to data formats and interfaces was key.

Results showed better operator clarity, more reliable telemetry displays, and improved testing efficiency. Discussion highlighted that well-maintained software tooling and clear UIs significantly impact drone testing quality, even outside flight-critical code.

Chapter 5 Conclusions

5.1 Summary

The internship delivered hands-on experience with drone software systems, covering internal tool maintenance, MAVLink integration support, UI/UX improvements, automation, and monitoring. It bridged academic theory with industrial practice, strengthening technical and professional skills.

5.2 Limitations

- Access restrictions limited changes to core/secure components.
- Scope excluded flight-critical firmware.
- Short timeline to fully master complex existing systems.
- Real-time variability sometimes made issues hard to reproduce.
- Some legacy components lacked full documentation.

5.3 Future Improvement

- Expand documentation for faster onboarding and knowledge transfer.
- More structured onboarding and mentorship for interns.
- Modernize tools/frameworks and enhance automated testing.
- Formalize user feedback loops for UI/UX iterations.
- Broaden intern exposure to more system areas under supervision.

References

1. MAVLink Development Team. “MAVLink Micro Air Vehicle Communication Protocol.” Accessed Dec. 10, 2025. https://mavlink.io/
2. QGroundControl Development Team. “QGroundControl Ground Control Station.” Accessed Dec. 10, 2025. https://qgroundcontrol.com/
3. M. A. Goodrich et al., “Supporting wilderness search and rescue using a camera-equipped mini UAV,” Journal of Field Robotics, vol. 25, no. 1-2, pp. 89-110, 2008.
4. A. P. Schoellig, F. L. Mueller, and R. D’Andrea, “Optimization-based iterative learning for precise quadrocopter trajectory tracking,” Autonomous Robots, vol. 33, pp. 103-127, 2012.
5. R. W. Beard and T. W. McLain, Small Unmanned Aircraft: Theory and Practice. Princeton University Press, 2012.
