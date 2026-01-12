import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sample works data matching seed.js
const sampleWorks = [
  {
    filename: '01_AI_Attendance_System.pdf',
    title: 'AI-Powered Student Attendance System',
    author: 'Alice Johnson',
    email: 'student1@university.edu',
    year: '2024',
    type: 'Project Report',
    category: 'Computer Science',
    abstract: `This project presents a comprehensive attendance management system utilizing facial recognition technology. The system is designed to automate the process of tracking student attendance in educational institutions, reducing manual effort and improving accuracy.

The implementation leverages Python for backend processing, TensorFlow for deep learning-based facial recognition, and React for the frontend user interface. The system achieves 98.5% accuracy in face detection under various lighting conditions.

Key features include:
- Real-time face detection and recognition
- Automatic attendance marking with timestamp
- Detailed analytics dashboard for administrators
- Mobile-responsive web interface
- Integration with existing student information systems
- Export functionality for attendance reports`,
    chapters: [
      { title: 'Introduction', content: 'The traditional method of taking attendance in educational institutions is time-consuming and prone to errors. Manual roll calls can take up valuable class time and proxy attendance remains a significant issue. This project addresses these challenges by implementing an automated facial recognition-based attendance system.' },
      { title: 'Literature Review', content: 'Facial recognition technology has evolved significantly over the past decade. Convolutional Neural Networks (CNNs) have become the standard approach for face detection and recognition tasks. Notable implementations include FaceNet, DeepFace, and ArcFace, each offering different trade-offs between accuracy and computational efficiency.' },
      { title: 'System Design', content: 'The system architecture follows a three-tier model consisting of presentation layer (React frontend), application layer (Python Flask backend), and data layer (PostgreSQL database). The facial recognition module uses a pre-trained MTCNN model for face detection and a custom-trained FaceNet model for feature extraction.' },
      { title: 'Implementation', content: 'The implementation phase involved setting up the development environment, training the facial recognition model on a dataset of 10,000 face images, developing the REST API endpoints, and creating the React-based user interface. Docker containers were used for deployment consistency.' },
      { title: 'Results and Discussion', content: 'Testing was conducted with 500 students over a period of 3 months. The system achieved 98.5% accuracy in attendance marking, with false positive and false negative rates of 0.8% and 0.7% respectively. Performance metrics show average recognition time of 0.3 seconds per face.' },
      { title: 'Conclusion', content: 'The AI-Powered Student Attendance System successfully demonstrates the practical application of facial recognition in educational settings. Future work includes implementing mask detection, improving low-light performance, and adding support for multiple camera feeds.' },
    ],
  },
  {
    filename: '02_Smart_Home_IoT.pdf',
    title: 'Smart Home IoT Control System',
    author: 'Bob Smith',
    email: 'student2@university.edu',
    year: '2024',
    type: 'Project Report',
    category: 'Computer Science',
    abstract: `This project implements a comprehensive Internet of Things (IoT) solution for smart home automation. The system enables users to control various home appliances including lighting, temperature, and security systems through a unified mobile application.

The technical implementation utilizes ESP32 microcontrollers as edge devices, MQTT protocol for reliable message passing, and Flutter for cross-platform mobile development. The system supports both local and cloud-based control modes.

Key features include:
- Voice control integration with Google Assistant
- Automated scheduling and routines
- Energy consumption monitoring
- Motion-triggered security alerts
- Multi-user access with role-based permissions`,
    chapters: [
      { title: 'Introduction', content: 'Smart home technology has become increasingly accessible to consumers. This project aims to create an affordable yet feature-rich home automation system that can be easily deployed and configured by non-technical users.' },
      { title: 'System Architecture', content: 'The system follows a hub-and-spoke architecture with a Raspberry Pi 4 serving as the central hub. ESP32 microcontrollers act as smart nodes controlling individual devices. Communication between nodes uses MQTT over WiFi.' },
      { title: 'Hardware Design', content: 'Each smart node consists of an ESP32 development board, relay modules for switching, and appropriate sensors (temperature, humidity, motion). PCB designs were created using KiCad for a more compact final product.' },
      { title: 'Software Implementation', content: 'The mobile app was developed using Flutter for cross-platform compatibility. The backend uses Node.js with Express, and MongoDB for data persistence. Real-time updates are handled through WebSocket connections.' },
      { title: 'Testing and Results', content: 'The system was tested in a real home environment for 2 months. Response time averaged 200ms for local commands and 500ms for cloud commands. Energy monitoring showed potential savings of 15-20% through automated scheduling.' },
      { title: 'Conclusion', content: 'The Smart Home IoT Control System provides a practical and cost-effective solution for home automation. The modular design allows for easy expansion and customization based on user needs.' },
    ],
  },
  {
    filename: '03_Crop_Disease_Detection.pdf',
    title: 'Machine Learning for Crop Disease Detection',
    author: 'Carol Williams',
    email: 'student3@university.edu',
    year: '2023',
    type: 'Master\'s Thesis',
    category: 'Research',
    abstract: `This thesis investigates the application of deep learning techniques for automated detection and classification of plant diseases from leaf images. Agricultural losses due to plant diseases significantly impact food security and farmer livelihoods worldwide.

The research develops and evaluates multiple convolutional neural network architectures for disease classification, achieving 94.2% accuracy on a dataset of 54,000 images spanning 38 disease categories across 14 crop species.

The key contributions include:
- A comprehensive survey of existing plant disease detection methods
- Novel data augmentation techniques for agricultural imagery
- Comparative analysis of CNN architectures for this domain
- A mobile application prototype for field deployment
- Recommendations for practical implementation in farming contexts`,
    chapters: [
      { title: 'Introduction', content: 'Plant diseases cause estimated annual losses of $220 billion globally. Early detection and treatment can significantly reduce these losses. Traditional disease identification relies on expert knowledge, which is often unavailable in rural farming communities. This research explores automated detection using machine learning.' },
      { title: 'Literature Review', content: 'Previous work in plant disease detection has utilized various approaches including traditional machine learning with handcrafted features, transfer learning from ImageNet-pretrained models, and custom CNN architectures. This chapter reviews 50 relevant publications from 2015-2023.' },
      { title: 'Methodology', content: 'The research methodology includes dataset preparation, model architecture design, training procedures, and evaluation metrics. The PlantVillage dataset was augmented with images collected from local farms to improve model generalization.' },
      { title: 'Dataset Analysis', content: 'The combined dataset contains 54,306 images across 14 crop species and 38 disease categories. Class imbalance was addressed through oversampling and weighted loss functions. Data augmentation included rotation, flipping, color jittering, and synthetic occlusions.' },
      { title: 'Model Architecture', content: 'Several architectures were evaluated: VGG16, ResNet50, InceptionV3, and a custom lightweight model for mobile deployment. The best performing model uses EfficientNet-B4 as the backbone with custom classification layers.' },
      { title: 'Experiments and Results', content: 'Training was performed on NVIDIA RTX 3090 GPUs using PyTorch. The best model achieved 94.2% accuracy, with per-class F1 scores ranging from 0.87 to 0.99. Confusion matrix analysis revealed common misclassifications between visually similar diseases.' },
      { title: 'Mobile Application', content: 'A prototype Android application was developed using TensorFlow Lite for on-device inference. The quantized model achieves 91.5% accuracy with inference time under 200ms on mid-range smartphones.' },
      { title: 'Discussion', content: 'The results demonstrate the feasibility of automated plant disease detection. Limitations include performance degradation under poor lighting conditions and with severely damaged leaves. Field trials showed 89% user satisfaction among farmers.' },
      { title: 'Conclusion and Future Work', content: 'This thesis contributes a practical solution for plant disease detection. Future work includes expanding the dataset to cover more crop species, implementing disease severity estimation, and integrating with agricultural advisory systems.' },
    ],
  },
  {
    filename: '04_ECommerce_Platform.pdf',
    title: 'E-Commerce Platform Development Report',
    author: 'David Brown',
    email: 'student4@university.edu',
    year: '2024',
    type: 'Technical Report',
    category: 'Computer Science',
    abstract: `This technical report documents the complete development lifecycle of a full-stack e-commerce platform. The project encompasses system design, database architecture, payment integration, and cloud deployment strategies.

The platform is built using modern web technologies including Next.js for the frontend, Node.js with Express for the backend API, and PostgreSQL for data persistence. Payment processing is handled through Stripe integration.

Key topics covered include:
- Requirements analysis and system design
- Database schema design and optimization
- RESTful API development best practices
- Payment gateway integration and security
- AWS deployment architecture
- Performance optimization techniques`,
    chapters: [
      { title: 'Project Overview', content: 'The objective was to develop a scalable e-commerce platform capable of handling 10,000+ concurrent users. The platform supports multiple vendors, customer reviews, wishlist functionality, and various payment methods.' },
      { title: 'Requirements Analysis', content: 'Functional requirements were gathered through stakeholder interviews and competitor analysis. Non-functional requirements focused on performance (page load < 2s), security (PCI DSS compliance), and availability (99.9% uptime).' },
      { title: 'System Architecture', content: 'The system follows a microservices architecture with separate services for user management, product catalog, order processing, and payment handling. Services communicate through RabbitMQ message queues.' },
      { title: 'Database Design', content: 'PostgreSQL was chosen for ACID compliance and complex query support. The schema includes 25 tables with proper normalization and strategic denormalization for read performance. Redis is used for caching and session storage.' },
      { title: 'API Development', content: 'RESTful APIs were developed following OpenAPI 3.0 specification. Authentication uses JWT tokens with refresh token rotation. Rate limiting and request validation protect against abuse.' },
      { title: 'Payment Integration', content: 'Stripe integration handles credit card payments with support for multiple currencies. Webhook handlers process payment events asynchronously. PCI DSS compliance is achieved through Stripe Elements.' },
      { title: 'Deployment Strategy', content: 'The application is deployed on AWS using ECS for container orchestration, RDS for managed PostgreSQL, ElastiCache for Redis, and CloudFront for CDN. Infrastructure is managed through Terraform.' },
      { title: 'Performance Results', content: 'Load testing with 10,000 concurrent users showed average response time of 150ms. Database query optimization reduced page load time by 40%. CDN integration improved global access speeds.' },
    ],
  },
  {
    filename: '05_Renewable_Energy_Analysis.pdf',
    title: 'Renewable Energy Systems Analysis',
    author: 'Alice Johnson',
    email: 'student1@university.edu',
    year: '2023',
    type: 'Engineering Project',
    category: 'Engineering',
    abstract: `This engineering project analyzes the efficiency and feasibility of implementing solar and wind energy systems in tropical climates, specifically focused on a university campus setting.

The study includes comprehensive data collection over 12 months, cost-benefit analysis comparing different renewable energy configurations, and detailed implementation recommendations. Simulations using PVsyst and WindPRO software support the findings.

Key findings include:
- Solar PV systems show 15-20% higher efficiency in tropical conditions
- Hybrid solar-wind configurations optimize year-round energy production
- Projected ROI of 7-8 years for recommended configuration
- Potential to offset 60% of campus electricity consumption
- Carbon footprint reduction of 2,500 tons CO2 annually`,
    chapters: [
      { title: 'Introduction', content: 'Rising energy costs and environmental concerns drive the need for renewable energy adoption. This project evaluates the technical and economic feasibility of implementing renewable energy systems at the university campus.' },
      { title: 'Site Assessment', content: 'The campus spans 50 acres with multiple building types. Solar irradiance data was collected using pyranometers at 5 locations. Wind speed measurements were taken at 10m and 30m heights using anemometers.' },
      { title: 'Solar Energy Analysis', content: 'Analysis of solar potential considered roof space availability, shading from trees and buildings, and optimal panel orientation. PVsyst simulations modeled system performance for monocrystalline and thin-film panel options.' },
      { title: 'Wind Energy Analysis', content: 'Wind resource assessment revealed average wind speeds of 4.5 m/s, marginal for large turbines but suitable for small-scale installations. WindPRO simulations evaluated different turbine models and placement options.' },
      { title: 'Hybrid System Design', content: 'The recommended hybrid configuration combines 500kW rooftop solar installation with 50kW small wind turbines. Battery storage of 200kWh provides grid stabilization and peak shaving capabilities.' },
      { title: 'Economic Analysis', content: 'Total installation cost is estimated at $750,000. Annual energy savings of $95,000 yield simple payback period of 7.9 years. Government incentives could reduce payback to 5.5 years.' },
      { title: 'Environmental Impact', content: 'The proposed system would reduce CO2 emissions by 2,500 tons annually, equivalent to removing 540 cars from the road. Additional benefits include reduced heat island effect from rooftop installations.' },
      { title: 'Implementation Roadmap', content: 'A phased implementation over 3 years is recommended, starting with solar installations on buildings with highest consumption. This approach spreads capital expenditure and allows for learning and optimization.' },
    ],
  },
  {
    filename: '06_Banking_App_UIUX.pdf',
    title: 'Mobile Banking App UI/UX Design',
    author: 'Bob Smith',
    email: 'student2@university.edu',
    year: '2024',
    type: 'Design Presentation',
    category: 'Computer Science',
    abstract: `This presentation showcases the complete UI/UX design process for a next-generation mobile banking application. The project follows a human-centered design approach, incorporating extensive user research and iterative prototyping.

The design aims to simplify complex banking operations while maintaining security and building user trust. The final design system includes 50+ screen designs, comprehensive component library, and detailed interaction specifications.

Design highlights include:
- Streamlined onboarding reducing drop-off by 40%
- One-tap payments for frequent transactions
- Biometric authentication with graceful fallbacks
- Accessibility features exceeding WCAG 2.1 AA standards
- Dark mode and customizable themes`,
    chapters: [
      { title: 'Project Brief', content: 'The client requested a complete redesign of their mobile banking app to improve user engagement and reduce customer support calls. Key metrics targeted: 50% reduction in task completion time, 30% increase in daily active users.' },
      { title: 'User Research', content: 'Research included 20 user interviews, survey of 500 banking app users, and analysis of competitor apps. Key pain points identified: complex navigation, slow transaction processes, and confusing account information display.' },
      { title: 'Persona Development', content: 'Three primary personas were created: Tech-savvy young professional, Small business owner, and Senior user with limited tech experience. Design decisions were validated against all personas to ensure broad usability.' },
      { title: 'Information Architecture', content: 'Card sorting exercises with 30 participants informed the navigation structure. The final IA reduces maximum navigation depth from 5 levels to 3, with most common actions accessible from the home screen.' },
      { title: 'Wireframes', content: 'Low-fidelity wireframes were created for all 50+ screens. Multiple iterations were tested with users using paper prototypes. Key screens went through 4-5 design iterations before finalization.' },
      { title: 'Visual Design', content: 'The visual design system uses a calming blue palette to convey trust and security. Typography hierarchy uses Inter font family for clarity. Iconography follows Material Design guidelines with custom banking-specific icons.' },
      { title: 'Prototype and Testing', content: 'Interactive prototypes were built in Figma. Usability testing with 15 participants achieved System Usability Scale score of 87 (compared to 62 for existing app). Task success rate improved from 71% to 94%.' },
      { title: 'Design System', content: 'The delivered design system includes component library with 100+ components, spacing and layout guidelines, animation specifications, and developer handoff documentation. All components are built for responsiveness across device sizes.' },
    ],
  },
  {
    filename: '07_Blockchain_Voting.pdf',
    title: 'Blockchain-Based Voting System',
    author: 'Carol Williams',
    email: 'student3@university.edu',
    year: '2024',
    type: 'Project Report',
    category: 'Computer Science',
    abstract: `This project implements a secure electronic voting system leveraging blockchain technology to ensure transparency, immutability, and verifiability of election results. The system addresses key challenges in electronic voting including voter privacy, vote integrity, and result auditability.

The implementation uses Ethereum smart contracts for vote recording and tallying, with a React-based frontend providing an accessible voting interface. Zero-knowledge proofs enable vote verification without compromising voter privacy.

System features include:
- Tamper-proof vote recording on blockchain
- Anonymous yet verifiable voting
- Real-time result tallying
- Complete audit trail for transparency
- Resistance to common attack vectors`,
    chapters: [
      { title: 'Introduction', content: 'Electronic voting systems promise convenience and accessibility but face trust issues. Blockchain technology offers properties that address many concerns: decentralization prevents single points of failure, immutability ensures votes cannot be altered, and transparency allows public verification.' },
      { title: 'Background', content: 'This chapter covers blockchain fundamentals, smart contract programming, cryptographic voting schemes, and existing e-voting implementations. Analysis of previous blockchain voting projects identifies lessons learned and improvement opportunities.' },
      { title: 'System Requirements', content: 'Requirements derived from election standards include: voter authentication, vote privacy, vote integrity, universal verifiability, and resistance to coercion. Technical requirements include scalability for large elections and acceptable transaction costs.' },
      { title: 'Architecture Design', content: 'The system consists of four components: voter registration module, voting smart contract, tallying smart contract, and web frontend. The architecture separates voter identity from votes using commitment schemes.' },
      { title: 'Smart Contract Implementation', content: 'Two main contracts were developed: VoterRegistry for managing eligible voters and BallotBox for recording votes. Contracts are written in Solidity 0.8.x with security best practices. Gas optimization reduces voting cost to approximately $0.50 per vote.' },
      { title: 'Security Analysis', content: 'The system was analyzed against common attack vectors: Sybil attacks (prevented by registration), double voting (prevented by contract logic), vote buying (mitigated by receipt-freeness), and denial of service (mitigated by gas limits).' },
      { title: 'Testing and Evaluation', content: 'Testing included unit tests for smart contracts, integration tests for the full system, and a pilot election with 200 participants. The pilot achieved 100% vote accuracy with average voting time of 45 seconds.' },
      { title: 'Conclusion', content: 'The project demonstrates blockchain viability for voting systems. Limitations include transaction costs and the need for user cryptocurrency wallets. Future work includes layer-2 scaling solutions and mobile voting applications.' },
    ],
  },
  {
    filename: '08_Thai_NLP.pdf',
    title: 'Natural Language Processing for Thai Text',
    author: 'Dr. Emily Davis',
    email: 'professor@university.edu',
    year: '2023',
    type: 'Research Paper',
    category: 'Research',
    abstract: `This research paper presents novel approaches to Natural Language Processing specifically optimized for the Thai language. Thai presents unique challenges including lack of word boundaries, complex orthography, and limited annotated resources.

The research develops and evaluates models for three fundamental NLP tasks: word tokenization, named entity recognition, and sentiment analysis. State-of-the-art results are achieved on Thai benchmark datasets.

Key contributions include:
- Improved tokenization algorithm achieving 98.2% accuracy
- Thai NER model with 91.5% F1 score
- Sentiment analysis model for Thai social media
- Release of annotated datasets for Thai NLP research
- Pre-trained Thai language model (ThaiLM)`,
    chapters: [
      { title: 'Introduction', content: 'Thai is spoken by over 60 million people but remains underrepresented in NLP research. This paper addresses the unique challenges of Thai language processing and presents practical solutions applicable to real-world applications.' },
      { title: 'Thai Language Characteristics', content: 'Thai script is an abugida with 44 consonants, 15 vowel symbols, and 4 tone marks. Unlike English, Thai has no spaces between words, making tokenization a fundamental challenge. This chapter analyzes these characteristics and their implications for NLP.' },
      { title: 'Related Work', content: 'Previous Thai NLP work includes rule-based tokenizers (longest matching), statistical approaches (CRF-based), and recent neural methods. This chapter surveys 30 relevant papers and identifies gaps addressed by this research.' },
      { title: 'Word Tokenization', content: 'We propose a hybrid approach combining dictionary lookup with a BiLSTM-CRF model for out-of-vocabulary words. Training on 10 million words achieves 98.2% accuracy on the BEST2010 benchmark, improving over previous state-of-the-art by 1.3%.' },
      { title: 'Named Entity Recognition', content: 'Thai NER faces challenges of ambiguous boundaries and transliterated foreign names. Our model uses character-level embeddings to capture orthographic patterns. Results: Person 93.2% F1, Location 90.8% F1, Organization 88.5% F1.' },
      { title: 'Sentiment Analysis', content: 'We collected and annotated 50,000 Thai social media posts for sentiment analysis. A fine-tuned multilingual BERT model achieves 85.7% accuracy on positive/negative/neutral classification, outperforming previous methods by 4.2%.' },
      { title: 'Thai Language Model', content: 'ThaiLM is a BERT-base model pre-trained on 20GB of Thai text from various sources. The model is released publicly and achieves state-of-the-art results when fine-tuned for downstream tasks.' },
      { title: 'Discussion and Conclusion', content: 'This research advances Thai NLP capabilities across multiple tasks. Released resources include annotated datasets, pre-trained models, and open-source code. Future directions include multimodal Thai understanding and cross-lingual transfer learning.' },
    ],
  },
  {
    filename: '09_Database_Optimization.pdf',
    title: 'Database Performance Optimization Techniques',
    author: 'David Brown',
    email: 'student4@university.edu',
    year: '2024',
    type: 'Technical Report',
    category: 'Computer Science',
    abstract: `This technical report provides a comprehensive guide to database performance optimization strategies for modern web applications. The report covers both theoretical foundations and practical implementation techniques.

Topics include query optimization, indexing strategies, caching mechanisms, and horizontal scaling approaches. Case studies demonstrate real-world applications of these techniques with measurable performance improvements.

Key topics covered:
- Query execution plan analysis
- Index design and maintenance
- Connection pooling configuration
- Read replica implementation
- Caching layer integration
- Partitioning and sharding strategies`,
    chapters: [
      { title: 'Introduction', content: 'Database performance often becomes the bottleneck in web application scalability. This report synthesizes best practices from industry experience and academic research to provide actionable optimization guidance.' },
      { title: 'Query Optimization', content: 'Query optimization begins with understanding execution plans. This chapter covers EXPLAIN ANALYZE interpretation, common query anti-patterns (N+1 queries, SELECT *), and rewriting techniques. Example: Replacing correlated subqueries with JOINs reduced query time by 85%.' },
      { title: 'Indexing Strategies', content: 'Effective indexing dramatically improves read performance. Topics include B-tree vs. hash indexes, composite index column ordering, partial indexes, and index-only scans. Guidelines for identifying missing indexes from slow query logs are provided.' },
      { title: 'Connection Management', content: 'Connection pooling reduces overhead of connection establishment. Configuration recommendations for PgBouncer/ProxySQL include pool sizing formulas based on workload characteristics. Case study shows 60% latency reduction with proper pooling.' },
      { title: 'Caching Strategies', content: 'Multi-level caching includes query result caching, object caching, and page caching. Implementation patterns for Redis integration cover cache invalidation strategies (TTL, event-based, write-through). Hit rate optimization techniques are discussed.' },
      { title: 'Read Scaling', content: 'Read replicas distribute read load across multiple servers. Topics include replication lag management, query routing strategies, and consistency considerations. PostgreSQL streaming replication setup is demonstrated step-by-step.' },
      { title: 'Partitioning and Sharding', content: 'For large datasets, partitioning improves query performance and maintenance operations. This chapter covers range, list, and hash partitioning in PostgreSQL. Sharding considerations for distributed databases include shard key selection and cross-shard queries.' },
      { title: 'Case Studies', content: 'Three case studies demonstrate optimization in practice: E-commerce platform (50x improvement), Social media application (20x improvement), and Analytics dashboard (10x improvement). Each case details the problem, analysis, solution, and results.' },
    ],
  },
  {
    filename: '10_Earthquake_Resistant_Buildings.pdf',
    title: 'Structural Analysis of Earthquake-Resistant Buildings',
    author: 'Alice Johnson',
    email: 'student1@university.edu',
    year: '2022',
    type: 'Master\'s Thesis',
    category: 'Engineering',
    abstract: `This thesis examines structural designs that minimize earthquake damage in multi-story buildings. The research combines theoretical analysis, finite element simulations, and cost comparisons of different construction methods.

The study focuses on reinforced concrete frame structures typical of Southeast Asian construction. Various seismic isolation and energy dissipation techniques are evaluated through numerical simulations using SAP2000 and ETABS software.

Key contributions include:
- Comparative analysis of 5 seismic resistant systems
- Optimal design guidelines for different seismic zones
- Cost-benefit analysis of retrofitting options
- Simplified assessment method for existing buildings
- Design recommendations for local construction practices`,
    chapters: [
      { title: 'Introduction', content: 'Southeast Asia lies within the Pacific Ring of Fire, making earthquake resistance critical for building design. This thesis addresses the gap between advanced seismic engineering research and local construction practices.' },
      { title: 'Earthquake Engineering Fundamentals', content: 'This chapter covers seismology basics, ground motion characteristics, structural dynamics, and building response to earthquakes. Key concepts include natural frequency, damping, ductility, and response spectrum analysis.' },
      { title: 'Literature Review', content: 'Review of seismic resistant systems includes moment-resisting frames, braced frames, shear walls, base isolation, and damper systems. Historical performance of different systems in major earthquakes is analyzed.' },
      { title: 'Methodology', content: 'The research methodology involves designing a typical 10-story building using 5 different seismic resistant systems. Each design is analyzed using nonlinear time-history analysis with 7 ground motion records scaled to local seismic hazard.' },
      { title: 'Finite Element Modeling', content: 'Detailed FEM models were created in ETABS. Modeling considerations include material nonlinearity, geometric nonlinearity, and soil-structure interaction. Model validation was performed against experimental data from shake table tests.' },
      { title: 'Analysis Results', content: 'Results compare inter-story drift, base shear, and structural damage indices across systems. Base isolated buildings showed 60% reduction in superstructure forces. Viscous dampers achieved 40% drift reduction with minimal architectural impact.' },
      { title: 'Cost Analysis', content: 'Construction cost estimates for each system were developed using local material and labor rates. Life-cycle cost analysis includes expected earthquake damage over 50-year building life. Base isolation adds 8-12% to construction cost but reduces expected damage costs by 70%.' },
      { title: 'Design Guidelines', content: 'Practical design guidelines are developed for different seismic zones and building types. Simplified assessment procedures allow engineers to evaluate existing buildings for retrofit prioritization.' },
      { title: 'Conclusion', content: 'The thesis provides evidence-based recommendations for seismic resistant design in Southeast Asia. Key findings support increased adoption of base isolation for critical facilities and viscous dampers for retrofitting existing buildings.' },
    ],
  },
];

// Generate PDF for each work
async function generatePDF(work) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 72, bottom: 72, left: 72, right: 72 },
      info: {
        Title: work.title,
        Author: work.author,
        Subject: work.category,
        Keywords: `${work.type}, ${work.category}, ${work.year}`,
        Creator: 'Student Work Archive System',
      },
    });

    const outputPath = path.join(__dirname, work.filename);
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // Title Page
    doc.fontSize(24).font('Helvetica-Bold');
    doc.moveDown(4);
    doc.text(work.title, { align: 'center' });

    doc.moveDown(2);
    doc.fontSize(14).font('Helvetica');
    doc.text(work.type, { align: 'center' });

    doc.moveDown(4);
    doc.fontSize(12);
    doc.text(`Author: ${work.author}`, { align: 'center' });
    doc.text(`Email: ${work.email}`, { align: 'center' });
    doc.moveDown();
    doc.text(`Category: ${work.category}`, { align: 'center' });
    doc.text(`Academic Year: ${work.year}`, { align: 'center' });

    doc.moveDown(8);
    doc.fontSize(10).fillColor('#666');
    doc.text('Student Work Archive System', { align: 'center' });
    doc.text('Sample Document for Testing Purposes', { align: 'center' });

    // Abstract Page
    doc.addPage();
    doc.fillColor('#000');
    doc.fontSize(18).font('Helvetica-Bold');
    doc.text('Abstract', { align: 'center' });
    doc.moveDown();

    doc.fontSize(11).font('Helvetica');
    doc.text(work.abstract, {
      align: 'justify',
      lineGap: 4,
    });

    // Table of Contents
    doc.addPage();
    doc.fontSize(18).font('Helvetica-Bold');
    doc.text('Table of Contents', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(12).font('Helvetica');
    work.chapters.forEach((chapter, index) => {
      doc.text(`${index + 1}. ${chapter.title}`, {
        continued: false,
      });
      doc.moveDown(0.5);
    });

    // Chapters
    work.chapters.forEach((chapter, index) => {
      doc.addPage();

      // Chapter header
      doc.fontSize(16).font('Helvetica-Bold');
      doc.text(`Chapter ${index + 1}`, { align: 'left' });
      doc.fontSize(20);
      doc.text(chapter.title, { align: 'left' });
      doc.moveDown();

      // Chapter content
      doc.fontSize(11).font('Helvetica');
      doc.text(chapter.content, {
        align: 'justify',
        lineGap: 4,
      });

      // Add some filler content to make chapters longer
      doc.moveDown();
      doc.fillColor('#333');
      doc.text('This section contains additional technical details and supporting information relevant to the chapter topic. The content demonstrates the depth of research and analysis conducted throughout this study.', {
        align: 'justify',
        lineGap: 4,
      });

      doc.moveDown();
      doc.text('Further considerations include implementation specifics, potential limitations, and suggestions for future improvements. These elements contribute to the comprehensive nature of this academic work.', {
        align: 'justify',
        lineGap: 4,
      });
      doc.fillColor('#000');
    });

    // References Page
    doc.addPage();
    doc.fontSize(18).font('Helvetica-Bold');
    doc.text('References', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(10).font('Helvetica');
    const references = [
      '[1] Smith, J. et al. (2023). "Modern Approaches to Software Development." Journal of Computer Science, 45(3), 123-145.',
      '[2] Johnson, A. (2022). "Best Practices in System Design." ACM Computing Surveys, 54(2), 1-35.',
      '[3] Williams, R. & Brown, T. (2023). "Advances in Machine Learning Applications." IEEE Transactions on AI, 12(4), 567-589.',
      '[4] Davis, M. (2021). "User Experience Design Principles." HCI International Conference Proceedings, 234-256.',
      '[5] Anderson, P. et al. (2022). "Scalable Web Architecture." Proceedings of WWW Conference, 789-802.',
    ];

    references.forEach(ref => {
      doc.text(ref, { align: 'left' });
      doc.moveDown(0.5);
    });

    // Finalize
    doc.end();

    stream.on('finish', () => {
      console.log(`  Generated: ${work.filename}`);
      resolve();
    });

    stream.on('error', reject);
  });
}

// Main execution
async function main() {
  console.log('\n========================================');
  console.log('Generating Sample PDF Files');
  console.log('========================================\n');

  for (const work of sampleWorks) {
    await generatePDF(work);
  }

  console.log('\n========================================');
  console.log(`Generated ${sampleWorks.length} PDF files in SampleData/`);
  console.log('========================================\n');
  console.log('You can now upload these files to Google Drive.');
}

main().catch(console.error);
