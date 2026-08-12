import { TemplateDefinition } from '../types';

export const RADIOLOGY_TEMPLATES: TemplateDefinition[] = [
  // 1. Ultrasound Abdomen
  {
    id: 'usg-abdomen',
    name: 'Ultrasound Whole Abdomen',
    modality: 'USG',
    category: 'Ultrasound',
    description: 'Comprehensive evaluation of liver, gallbladder, pancreas, spleen, kidneys, and abdominal cavity.',
    fields: [
      { id: 'liver_size', label: 'Liver Size', type: 'number', unit: 'cm', defaultValue: 15.2, normalMin: 10, normalMax: 15.5, category: 'Liver' },
      { id: 'liver_echotexture', label: 'Liver Echotexture', type: 'select', options: ['Normal', 'Increased (Fatty Infiltration)', 'Coarse', 'Nodular'], defaultValue: 'Increased (Fatty Infiltration)', category: 'Liver' },
      { id: 'liver_focal_lesion', label: 'Focal Lesion', type: 'select', options: ['No', 'Hemangioma', 'Cyst', 'Solid Mass', 'Calcification'], defaultValue: 'No', category: 'Liver' },
      { id: 'portal_vein_diameter', label: 'Portal Vein Diameter', type: 'number', unit: 'mm', defaultValue: 11.0, normalMin: 8, normalMax: 13, category: 'Liver' },
      { id: 'gb_distension', label: 'Gallbladder Distension', type: 'select', options: ['Normal', 'Partially contracted', 'Overdistended'], defaultValue: 'Normal', category: 'Gallbladder' },
      { id: 'gb_wall_thickness', label: 'Gallbladder Wall Thickness', type: 'number', unit: 'mm', defaultValue: 2.4, normalMin: 1.0, normalMax: 3.0, category: 'Gallbladder' },
      { id: 'gb_calculus', label: 'Gallbladder Calculus', type: 'boolean', defaultValue: true, category: 'Gallbladder' },
      { id: 'gb_calculus_size', label: 'Calculus Size', type: 'number', unit: 'mm', defaultValue: 6.0, category: 'Gallbladder' },
      { id: 'cbd_diameter', label: 'CBD Diameter', type: 'number', unit: 'mm', defaultValue: 5.2, normalMin: 3, normalMax: 6, category: 'Biliary System' },
      { id: 'spleen_size', label: 'Spleen Length', type: 'number', unit: 'cm', defaultValue: 10.5, normalMin: 7, normalMax: 12, category: 'Spleen' },
      { id: 'rk_length', label: 'Right Kidney Length', type: 'number', unit: 'cm', defaultValue: 10.4, normalMin: 9, normalMax: 12, category: 'Right Kidney' },
      { id: 'lk_length', label: 'Left Kidney Length', type: 'number', unit: 'cm', defaultValue: 10.8, normalMin: 9, normalMax: 12, category: 'Left Kidney' },
      { id: 'free_fluid', label: 'Free Fluid in Abdomen', type: 'select', options: ['Absent', 'Minimal in Pelvis', 'Moderate Ascites', 'Gross Ascites'], defaultValue: 'Absent', category: 'Peritoneum' }
    ]
  },

  // 2. Ultrasound Pelvis
  {
    id: 'usg-pelvis',
    name: 'Ultrasound Pelvis (Gynaec / Male)',
    modality: 'USG',
    category: 'Ultrasound',
    description: 'Pelvic imaging of uterus, endometrium, ovaries, POD fluid, or urinary bladder & prostate in male.',
    fields: [
      { id: 'uterus_size', label: 'Uterus Size (L x W x AP)', type: 'text', defaultValue: '7.8 x 4.2 x 3.5 cm', category: 'Uterus' },
      { id: 'uterus_position', label: 'Uterine Position', type: 'select', options: ['AVAF (Anteverted)', 'RVRF (Retroverted)', 'Midposed'], defaultValue: 'AVAF (Anteverted)', category: 'Uterus' },
      { id: 'myometrium', label: 'Myometrial Echo Pattern', type: 'select', options: ['Homogeneous', 'Heterogeneous (Adenomyosis)', 'Fibroid / Leiomyoma Present'], defaultValue: 'Homogeneous', category: 'Uterus' },
      { id: 'endometrial_thickness', label: 'Endometrial Thickness (ET)', type: 'number', unit: 'mm', defaultValue: 7.2, normalMin: 4, normalMax: 14, category: 'Endometrium' },
      { id: 'ro_vol', label: 'Right Ovary Volume', type: 'number', unit: 'cc', defaultValue: 6.2, normalMin: 2, normalMax: 10, category: 'Ovaries' },
      { id: 'lo_vol', label: 'Left Ovary Volume', type: 'number', unit: 'cc', defaultValue: 5.8, normalMin: 2, normalMax: 10, category: 'Ovaries' },
      { id: 'pod_fluid', label: 'Pouch of Douglas (POD) Fluid', type: 'select', options: ['Absent', 'Minimal clear fluid', 'Moderate fluid with internal echoes'], defaultValue: 'Absent', category: 'Pelvis' }
    ]
  },

  // 3. Ultrasound KUB
  {
    id: 'usg-kub',
    name: 'Ultrasound KUB & Prostate',
    modality: 'USG',
    category: 'Ultrasound',
    description: 'Renal, ureteric, bladder and prostate assessment with post-void residual calculation.',
    fields: [
      { id: 'rk_size', label: 'Right Kidney Length', type: 'number', unit: 'cm', defaultValue: 10.2, category: 'Right Kidney' },
      { id: 'rk_calculus_present', label: 'Right Calculus', type: 'boolean', defaultValue: true, category: 'Right Kidney' },
      { id: 'rk_calculus_size', label: 'Right Calculus Size', type: 'number', unit: 'mm', defaultValue: 5.4, category: 'Right Kidney' },
      { id: 'lk_size', label: 'Left Kidney Length', type: 'number', unit: 'cm', defaultValue: 10.6, category: 'Left Kidney' },
      { id: 'ub_prevoid_vol', label: 'Pre-void Bladder Volume', type: 'number', unit: 'mL', defaultValue: 320, category: 'Bladder' },
      { id: 'ub_postvoid_vol', label: 'Post-void Residual (PVR)', type: 'number', unit: 'mL', defaultValue: 45, category: 'Bladder' },
      { id: 'prostate_vol', label: 'Prostate Volume', type: 'number', unit: 'cc', defaultValue: 28, category: 'Prostate' }
    ]
  },

  // 4. Ultrasound Obstetric
  {
    id: 'usg-obstetric',
    name: 'Ultrasound Obstetric',
    modality: 'USG',
    category: 'Ultrasound',
    description: 'Fetal biometry, placental position, amniotic fluid index (AFI) and gestational age assessment.',
    fields: [
      { id: 'fetal_number', label: 'Fetal Number', type: 'select', options: ['Single intrauterine fetus', 'Twin gestation', 'Triplet'], defaultValue: 'Single intrauterine fetus', category: 'Fetus' },
      { id: 'fetal_cardiac_activity', label: 'Fetal Heart Rate', type: 'number', unit: 'bpm', defaultValue: 148, normalMin: 110, normalMax: 160, category: 'Fetus' },
      { id: 'presentation', label: 'Presentation', type: 'select', options: ['Cephalic', 'Breech', 'Transverse', 'Variable'], defaultValue: 'Cephalic', category: 'Fetus' },
      { id: 'bpd', label: 'Biparietal Diameter (BPD)', type: 'number', unit: 'mm', defaultValue: 72, category: 'Biometry' },
      { id: 'fl', label: 'Femur Length (FL)', type: 'number', unit: 'mm', defaultValue: 54, category: 'Biometry' },
      { id: 'efw', label: 'Estimated Fetal Weight (EFW)', type: 'number', unit: 'grams', defaultValue: 1250, category: 'Biometry' },
      { id: 'placenta_location', label: 'Placenta Location', type: 'select', options: ['Anterior', 'Posterior', 'Fundal', 'Low Lying', 'Placenta Previa'], defaultValue: 'Anterior', category: 'Placenta & Liquor' },
      { id: 'afi', label: 'Amniotic Fluid Index (AFI)', type: 'number', unit: 'cm', defaultValue: 13.5, normalMin: 8, normalMax: 24, category: 'Placenta & Liquor' }
    ]
  },

  // 5. Ultrasound NT Scan
  {
    id: 'usg-nt-scan',
    name: 'Ultrasound NT Scan (11-13+6 Weeks)',
    modality: 'USG',
    category: 'Ultrasound',
    description: 'First trimester screening for chromosomal abnormalities evaluating Nuchal Translucency, Nasal Bone & FHR.',
    fields: [
      { id: 'crl', label: 'Crown Rump Length (CRL)', type: 'number', unit: 'mm', defaultValue: 62.0, category: 'Biometry' },
      { id: 'nt_thickness', label: 'Nuchal Translucency (NT)', type: 'number', unit: 'mm', defaultValue: 1.6, normalMin: 0.8, normalMax: 2.5, category: 'NT Assessment' },
      { id: 'nasal_bone', label: 'Fetal Nasal Bone', type: 'select', options: ['Present & Ossified', 'Hypoplastic', 'Absent'], defaultValue: 'Present & Ossified', category: 'Markers' },
      { id: 'fhr', label: 'Fetal Heart Rate', type: 'number', unit: 'bpm', defaultValue: 158, normalMin: 140, normalMax: 170, category: 'Fetal Heart' },
      { id: 'ductus_venosus', label: 'Ductus Venosus Flow', type: 'select', options: ['Normal positive A-wave', 'Reversed A-wave'], defaultValue: 'Normal positive A-wave', category: 'Doppler' }
    ]
  },

  // 6. Ultrasound Anomaly Scan
  {
    id: 'usg-anomaly-scan',
    name: 'Ultrasound Anomaly Scan (Level II Target)',
    modality: 'USG',
    category: 'Ultrasound',
    description: 'Detailed second trimester structural anatomical survey from head to toe.',
    fields: [
      { id: 'fetal_brain', label: 'CNS & Intracranial Structures', type: 'select', options: ['Normal fetal brain anatomy', 'Ventriculomegaly', 'Anencephaly'], defaultValue: 'Normal fetal brain anatomy', category: 'Anatomy' },
      { id: 'fetal_spine', label: 'Fetal Spine', type: 'select', options: ['Intact skin coverage & alignment', 'Spina Bifida Defect'], defaultValue: 'Intact skin coverage & alignment', category: 'Anatomy' },
      { id: 'four_chamber_heart', label: 'Four Chamber Cardiac View', type: 'select', options: ['Normal cardiac axis & 4 chambers', 'VSD / ASD detected'], defaultValue: 'Normal cardiac axis & 4 chambers', category: 'Cardiovascular' },
      { id: 'stomach_bubble', label: 'Stomach Bubble & Bowel', type: 'select', options: ['Normal left sided stomach bubble', 'Echogenic Bowel'], defaultValue: 'Normal left sided stomach bubble', category: 'Gastrointestinal' },
      { id: 'kidneys_bladder', label: 'Fetal Kidneys & Bladder', type: 'select', options: ['Bilateral kidneys & bladder visualized', 'Pelviectasis'], defaultValue: 'Bilateral kidneys & bladder visualized', category: 'Genitourinary' },
      { id: 'limbs', label: 'Fetal Limbs & Extremities', type: 'select', options: ['All 4 limbs with 3 segments seen', 'Clubfoot / Talipes'], defaultValue: 'All 4 limbs with 3 segments seen', category: 'Musculoskeletal' }
    ]
  },

  // 7. Ultrasound Growth Scan
  {
    id: 'usg-growth-scan',
    name: 'Ultrasound Fetal Growth & Wellbeing',
    modality: 'USG',
    category: 'Ultrasound',
    description: 'Third trimester growth trajectory tracking, fetal weight percentile, and biophysical profile.',
    fields: [
      { id: 'gestational_age', label: 'Gestational Age (USG)', type: 'text', defaultValue: '32 Weeks 4 Days', category: 'Growth' },
      { id: 'efw_percentile', label: 'EFW Growth Percentile', type: 'number', unit: '%', defaultValue: 54, normalMin: 10, normalMax: 90, category: 'Growth' },
      { id: 'bpd', label: 'BPD Measurement', type: 'number', unit: 'mm', defaultValue: 82, category: 'Biometry' },
      { id: 'ac', label: 'Abdominal Circumference (AC)', type: 'number', unit: 'mm', defaultValue: 284, category: 'Biometry' },
      { id: 'fl', label: 'Femur Length (FL)', type: 'number', unit: 'mm', defaultValue: 62, category: 'Biometry' },
      { id: 'bpp_score', label: 'Biophysical Profile Score (BPP)', type: 'select', options: ['8/8', '6/8', '4/8 (Hypoxia risk)'], defaultValue: '8/8', category: 'Wellbeing' }
    ]
  },

  // 8. Ultrasound Doppler
  {
    id: 'usg-doppler',
    name: 'Ultrasound Color Doppler (Arterial / Venous / Obstetric)',
    modality: 'USG',
    category: 'Ultrasound',
    description: 'Hemodynamic flow velocities, RI/PI indices in umbilical, carotid, renal, or limb vessels.',
    fields: [
      { id: 'umbilical_pi', label: 'Umbilical Artery Pulsatility Index (PI)', type: 'number', defaultValue: 0.92, normalMin: 0.6, normalMax: 1.2, category: 'Umbilical Doppler' },
      { id: 'mca_pi', label: 'Middle Cerebral Artery (MCA) PI', type: 'number', defaultValue: 1.54, normalMin: 1.1, normalMax: 2.2, category: 'MCA Doppler' },
      { id: 'cpr_ratio', label: 'Cerebroplacental Ratio (CPR)', type: 'number', defaultValue: 1.67, normalMin: 1.0, normalMax: 2.5, category: 'Hemodynamics' },
      { id: 'venous_flow', label: 'Venous Compressibility & Flow', type: 'select', options: ['Completely compressible, normal phasic flow', 'Deep Vein Thrombosis (DVT)', 'Venous Insufficiency'], defaultValue: 'Completely compressible, normal phasic flow', category: 'Venous' }
    ]
  },

  // 9. X-Ray Chest
  {
    id: 'xray-chest',
    name: 'X-Ray Chest PA View',
    modality: 'X-RAY',
    category: 'Radiography',
    description: 'Radiographic assessment of lung parenchyma, cardiomediasstinal silhouette, CP angles and bony thorax.',
    fields: [
      { id: 'lung_fields', label: 'Lung Parenchyma', type: 'select', options: ['Clear & well-aerated bilaterally', 'Infiltrates in R lower zone', 'Consolidation', 'Opacities', 'Emphysematous changes'], defaultValue: 'Clear & well-aerated bilaterally', category: 'Lungs' },
      { id: 'cardiac_size', label: 'Cardiothoracic Ratio (CTR)', type: 'number', unit: '%', defaultValue: 48, normalMin: 35, normalMax: 50, category: 'Heart & Mediastinum' },
      { id: 'cp_angles', label: 'Costophrenic Angles', type: 'select', options: ['Sharp & clear bilaterally', 'Blunted right CP angle', 'Blunted left CP angle', 'Bilateral blunting'], defaultValue: 'Sharp & clear bilaterally', category: 'Pleura' },
      { id: 'bony_cage', label: 'Thoracic Cage & Ribs', type: 'select', options: ['Intact bony skeleton', 'Fracture detected', 'Degenerative changes'], defaultValue: 'Intact bony skeleton', category: 'Bony Thorax' }
    ]
  },

  // 10. X-Ray Spine
  {
    id: 'xray-spine',
    name: 'X-Ray Spine (Cervical / Lumbar AP & Lateral)',
    modality: 'X-RAY',
    category: 'Radiography',
    description: 'Evaluation of vertebral curvature, disc space height, marginal osteophytes and pedicles.',
    fields: [
      { id: 'spine_alignment', label: 'Spinal Alignment', type: 'select', options: ['Normal lordosis maintained', 'Straightening of spine (Spasm)', 'Scoliosis present'], defaultValue: 'Normal lordosis maintained', category: 'Alignment' },
      { id: 'disc_space', label: 'Intervertebral Disc Spaces', type: 'select', options: ['Preserved disc height throughout', 'Disc space narrowing L4-L5', 'Disc space narrowing L5-S1'], defaultValue: 'Preserved disc height throughout', category: 'Discs' },
      { id: 'osteophytes', label: 'Marginal Osteophytes', type: 'select', options: ['None', 'Mild anterior osteophytosis', 'Prominent bridging osteophytes'], defaultValue: 'Mild anterior osteophytosis', category: 'Vertebrae' }
    ]
  },

  // 11. X-Ray Extremities
  {
    id: 'xray-extremities',
    name: 'X-Ray Extremities (Bone & Joint AP/Lat)',
    modality: 'X-RAY',
    category: 'Radiography',
    description: 'Assessment of cortical continuity, joint alignment, soft tissue swelling, or articular erosion.',
    fields: [
      { id: 'cortical_bone', label: 'Cortical Skeleton Integrity', type: 'select', options: ['Intact cortex, no fracture line', 'Acute cortical fracture seen', 'Old healed fracture'], defaultValue: 'Intact cortex, no fracture line', category: 'Bone' },
      { id: 'joint_space', label: 'Joint Space & Articular Surface', type: 'select', options: ['Normal joint space preserved', 'Joint space narrowing', 'Dislocation / Subluxation'], defaultValue: 'Normal joint space preserved', category: 'Joints' },
      { id: 'soft_tissues', label: 'Periarticular Soft Tissues', type: 'select', options: ['Normal soft tissue outline', 'Soft tissue swelling present', 'Foreign body detected'], defaultValue: 'Normal soft tissue outline', category: 'Soft Tissue' }
    ]
  },

  // 12. CT Brain
  {
    id: 'ct-brain',
    name: 'CT Brain (NCCT)',
    modality: 'CT',
    category: 'Computed Tomography',
    description: 'Non-contrast CT scan for acute stroke, hemorrhage, mass effect, ventricular system, and skull vault.',
    fields: [
      { id: 'parenchyma_density', label: 'Brain Parenchyma Density', type: 'select', options: ['Normal attenuation bilaterally', 'Acute hyperdense hemorrhage', 'Hypodense acute infarct', 'Chronic ischemic changes'], defaultValue: 'Normal attenuation bilaterally', category: 'Parenchyma' },
      { id: 'hemorrhage', label: 'Intracranial Hemorrhage', type: 'select', options: ['None', 'Parenchymal', 'Subdural (SDH)', 'Epidural (EDH)', 'Subarachnoid (SAH)'], defaultValue: 'None', category: 'Parenchyma' },
      { id: 'midline_shift', label: 'Midline Shift', type: 'number', unit: 'mm', defaultValue: 0, normalMin: 0, normalMax: 0, category: 'Mass Effect' },
      { id: 'ventricles', label: 'Ventricular System', type: 'select', options: ['Normal size and symmetry', 'Dilated (Hydrocephalus)', 'Compressed'], defaultValue: 'Normal size and symmetry', category: 'Ventricular System' }
    ]
  },

  // 13. CT Chest
  {
    id: 'ct-chest',
    name: 'CT Chest (HRCT / CECT)',
    modality: 'CT',
    category: 'Computed Tomography',
    description: 'High-Resolution CT evaluation of pulmonary parenchyma, airways, bronchiectasis, and mediastinum.',
    fields: [
      { id: 'lung_nodule', label: 'Pulmonary Nodule Detected', type: 'boolean', defaultValue: true, category: 'Lungs' },
      { id: 'nodule_size', label: 'Nodule Size', type: 'number', unit: 'mm', defaultValue: 8.0, category: 'Lungs' },
      { id: 'ground_glass', label: 'Ground Glass Opacities', type: 'select', options: ['Absent', 'Focal', 'Multifocal bilateral'], defaultValue: 'Absent', category: 'Lungs' },
      { id: 'mediastinal_nodes', label: 'Mediastinal Lymphadenopathy', type: 'select', options: ['No enlarged nodes (<10mm)', 'Enlarged subcarinal node', 'Bilateral hilar lymphadenopathy'], defaultValue: 'No enlarged nodes (<10mm)', category: 'Mediastinum' }
    ]
  },

  // 14. CT Abdomen
  {
    id: 'ct-abdomen',
    name: 'CT Abdomen & Pelvis (CECT)',
    modality: 'CT',
    category: 'Computed Tomography',
    description: 'Contrast-enhanced cross-sectional imaging of solid abdominal viscera, bowel loops, mesentery, and lymph nodes.',
    fields: [
      { id: 'liver_attenuation', label: 'Liver Parenchyma & Enhancement', type: 'select', options: ['Homogeneous enhancement', 'Hypodense focal lesion', 'Fatty liver attenuation'], defaultValue: 'Homogeneous enhancement', category: 'Liver' },
      { id: 'bowel_loops', label: 'Bowel Loops & Wall Thickness', type: 'select', options: ['Normal caliber & enhancement', 'Wall thickening in ileum', 'Bowel obstruction'], defaultValue: 'Normal caliber & enhancement', category: 'Gastrointestinal' },
      { id: 'ascites', label: 'Peritoneal Free Fluid / Air', type: 'select', options: ['Absent', 'Minimal fluid', 'Pneumoperitoneum'], defaultValue: 'Absent', category: 'Peritoneum' }
    ]
  },

  // 15. CT KUB
  {
    id: 'ct-kub',
    name: 'CT KUB (Non-Contrast Stone Protocol)',
    modality: 'CT',
    category: 'Computed Tomography',
    description: 'Low-dose non-contrast CT for renal & ureteric calculus location, size, density (HU) and hydronephrosis.',
    fields: [
      { id: 'calculus_location', label: 'Calculus Anatomical Location', type: 'select', options: ['None', 'Right UVJ', 'Right PUJ', 'Left Mid Ureter', 'Right Lower Pole Kidney'], defaultValue: 'Right UVJ', category: 'Calculus' },
      { id: 'calculus_size', label: 'Calculus Max Size', type: 'number', unit: 'mm', defaultValue: 6.5, category: 'Calculus' },
      { id: 'calculus_hu', label: 'Calculus Density (Hounsfield Units)', type: 'number', unit: 'HU', defaultValue: 850, category: 'Calculus' },
      { id: 'hydronephrosis_degree', label: 'Proximal Hydroureteronephrosis', type: 'select', options: ['None', 'Mild', 'Moderate', 'Severe'], defaultValue: 'Moderate', category: 'Kidneys' }
    ]
  },

  // 16. CT PNS
  {
    id: 'ct-pns',
    name: 'CT Paranasal Sinuses (PNS Coronal/Axial)',
    modality: 'CT',
    category: 'Computed Tomography',
    description: 'Evaluation of maxillary, frontal, ethmoid and sphenoid sinus mucosal thickening and osteomeatal complex (OMC).',
    fields: [
      { id: 'maxillary_sinus', label: 'Maxillary Sinuses', type: 'select', options: ['Clear & pneumatic bilaterally', 'Right mucosal thickening', 'Left mucosal retention cyst'], defaultValue: 'Right mucosal thickening', category: 'Sinuses' },
      { id: 'ethmoid_sinus', label: 'Ethmoid Air Cells', type: 'select', options: ['Clear bilaterally', 'Ethmoid polyposis / Opacification'], defaultValue: 'Clear bilaterally', category: 'Sinuses' },
      { id: 'omc_patency', label: 'Osteomeatal Complex (OMC)', type: 'select', options: ['Patent bilaterally', 'Blocked right OMC', 'Blocked left OMC'], defaultValue: 'Blocked right OMC', category: 'OMC' },
      { id: 'nasal_septum', label: 'Nasal Septum', type: 'select', options: ['Central & straight', 'Deviated to Right (DNS)', 'Deviated to Left (DNS)'], defaultValue: 'Deviated to Right (DNS)', category: 'Nasal Cavity' }
    ]
  },

  // 17. MRI Brain
  {
    id: 'mri-brain',
    name: 'MRI Brain (T1, T2, FLAIR, DWI)',
    modality: 'MRI',
    category: 'Magnetic Resonance Imaging',
    description: 'High-resolution multi-planar MRI scan of the brain including DWI/ADC restriction analysis.',
    fields: [
      { id: 't1_t2_flair', label: 'T1/T2/FLAIR Signals', type: 'select', options: ['Normal signal intensity', 'Hyperintense FLAIR white matter foci', 'Solitary rim-enhancing lesion', 'Demyelinating plaques'], defaultValue: 'Normal signal intensity', category: 'Signal Intensities' },
      { id: 'dwi_restriction', label: 'DWI Diffusion Restriction', type: 'select', options: ['No acute diffusion restriction', 'Positive diffusion restriction (Acute Infarct)', 'Facilitated diffusion'], defaultValue: 'No acute diffusion restriction', category: 'Diffusion' },
      { id: 'lesion_location', label: 'Lesion Anatomical Site', type: 'select', options: ['None', 'Periventricular White Matter', 'Basal Ganglia', 'Cerebellum', 'Brainstem'], defaultValue: 'None', category: 'Lesion' }
    ]
  },

  // 18. MRI Spine
  {
    id: 'mri-spine',
    name: 'MRI Spine (Cervical / Lumbar)',
    modality: 'MRI',
    category: 'Magnetic Resonance Imaging',
    description: 'Evaluation of spinal cord, intervertebral discs, thecal sac, and neural foraminal nerve root compression.',
    fields: [
      { id: 'lordosis', label: 'Spinal Alignment', type: 'select', options: ['Normal lordosis maintained', 'Straightening of lordosis (Spasm)'], defaultValue: 'Normal lordosis maintained', category: 'Alignment' },
      { id: 'disc_level', label: 'Primary Disc Pathology Level', type: 'select', options: ['None / Intact Discs', 'L3-L4', 'L4-L5', 'L5-S1', 'C5-C6'], defaultValue: 'L4-L5', category: 'Discs' },
      { id: 'disc_morphology', label: 'Disc Herniation Type', type: 'select', options: ['Normal hydration', 'Disc Desiccation', 'Posterior Bulge', 'Paracentral Protrusion', 'Extrusion'], defaultValue: 'Paracentral Protrusion', category: 'Discs' },
      { id: 'canal_stenosis', label: 'Spinal Canal Diameter', type: 'number', unit: 'mm', defaultValue: 13.5, normalMin: 12, normalMax: 18, category: 'Canal' }
    ]
  },

  // 19. MRI Knee
  {
    id: 'mri-knee',
    name: 'MRI Knee Joint',
    modality: 'MRI',
    category: 'Magnetic Resonance Imaging',
    description: 'Multi-planar evaluation of ACL, PCL, medial/lateral menisci, collateral ligaments, and cartilage.',
    fields: [
      { id: 'medial_meniscus', label: 'Medial Meniscus', type: 'select', options: ['Intact normal signal', 'Grade I signal', 'Grade II intrameniscal signal', 'Grade III Tear (Posterior Horn)'], defaultValue: 'Grade III Tear (Posterior Horn)', category: 'Menisci' },
      { id: 'lateral_meniscus', label: 'Lateral Meniscus', type: 'select', options: ['Intact normal signal', 'Meniscal tear'], defaultValue: 'Intact normal signal', category: 'Menisci' },
      { id: 'acl_status', label: 'Anterior Cruciate Ligament (ACL)', type: 'select', options: ['Intact normal fibers', 'Partial tear', 'Complete disruption / tear'], defaultValue: 'Intact normal fibers', category: 'Cruciate Ligaments' },
      { id: 'joint_effusion', label: 'Joint Effusion', type: 'select', options: ['None', 'Minimal', 'Moderate knee effusion'], defaultValue: 'Moderate knee effusion', category: 'Joint' }
    ]
  },

  // 20. MRI Shoulder
  {
    id: 'mri-shoulder',
    name: 'MRI Shoulder Joint',
    modality: 'MRI',
    category: 'Magnetic Resonance Imaging',
    description: 'Evaluation of supraspinatus tendon, rotator cuff complex, glenoid labrum, and AC joint.',
    fields: [
      { id: 'supraspinatus', label: 'Supraspinatus Tendon', type: 'select', options: ['Intact normal tendon', 'Tendinosis / Hyperintensity', 'Partial thickness tear', 'Full thickness tear'], defaultValue: 'Partial thickness tear', category: 'Rotator Cuff' },
      { id: 'glenoid_labrum', label: 'Glenoid Labrum', type: 'select', options: ['Intact fibrocartilage', 'SLAP tear (Superior Labrum)', 'Bankart lesion'], defaultValue: 'Intact fibrocartilage', category: 'Labrum' },
      { id: 'biceps_tendon', label: 'Long Head of Biceps Tendon', type: 'select', options: ['Normal in bicipital groove', 'Subluxed', 'Tenosynovitis'], defaultValue: 'Normal in bicipital groove', category: 'Biceps' }
    ]
  },

  // 21. MRI Abdomen/Pelvis
  {
    id: 'mri-abdomen-pelvis',
    name: 'MRI Abdomen / Pelvis / MRCP',
    modality: 'MRI',
    category: 'Magnetic Resonance Imaging',
    description: 'High-resolution tissue characterization, MRCP biliary tree imaging, or pelvic organ pathology.',
    fields: [
      { id: 'biliary_tree', label: 'MRCP Biliary Duct System', type: 'select', options: ['Normal intra/extrahepatic ducts', 'Choledocholithiasis', 'Stricture at CBD'], defaultValue: 'Normal intra/extrahepatic ducts', category: 'MRCP' },
      { id: 'pelvic_mass', label: 'Pelvic Organs / Mass Characterization', type: 'select', options: ['Normal pelvic organs', 'Uterine fibroid', 'Ovarian complex cyst', 'Prostate PI-RADS lesion'], defaultValue: 'Normal pelvic organs', category: 'Pelvis' }
    ]
  },

  // 22. Mammography Screening
  {
    id: 'mammo-screening',
    name: 'Mammography Bilateral (Screening CC/MLO)',
    modality: 'MAMMOGRAPHY',
    category: 'Breast Imaging',
    description: 'Bilateral craniocaudal and mediolateral oblique mammographic screening with BI-RADS assessment.',
    fields: [
      { id: 'parenchymal_composition', label: 'Breast Tissue Density', type: 'select', options: ['a. Almost entirely fatty', 'b. Scattered fibroglandular densities', 'c. Heterogeneously dense', 'd. Extremely dense'], defaultValue: 'b. Scattered fibroglandular densities', category: 'Composition' },
      { id: 'right_breast_mass', label: 'Right Breast Mass', type: 'boolean', defaultValue: false, category: 'Right Breast' },
      { id: 'left_breast_mass', label: 'Left Breast Mass', type: 'boolean', defaultValue: true, category: 'Left Breast' },
      { id: 'left_mass_size', label: 'Left Mass Size', type: 'number', unit: 'mm', defaultValue: 12, category: 'Left Breast' },
      { id: 'birads_category', label: 'BI-RADS Assessment Category', type: 'select', options: ['BI-RADS 1: Negative', 'BI-RADS 2: Benign', 'BI-RADS 3: Probably Benign', 'BI-RADS 4: Suspicious', 'BI-RADS 5: Highly Suggestive of Malignancy'], defaultValue: 'BI-RADS 2: Benign', category: 'BI-RADS' }
    ]
  },

  // 23. Echo 2D Echo
  {
    id: 'echo-2d',
    name: '2D Echocardiogram & Color Doppler',
    modality: 'ECHO',
    category: 'Cardiology',
    description: 'Transthoracic cardiac ultrasound evaluating chamber dimensions, ejection fraction (LVEF), and valvular flow.',
    fields: [
      { id: 'lvef', label: 'Left Ventricular Ejection Fraction (LVEF)', type: 'number', unit: '%', defaultValue: 62, normalMin: 55, normalMax: 75, category: 'LV Function' },
      { id: 'wall_motion', label: 'Regional Wall Motion Abnormality (RWMA)', type: 'select', options: ['No RWMA at rest', 'Anterior wall hypokinesia', 'Inferior wall hypokinesia', 'Global hypokinesia'], defaultValue: 'No RWMA at rest', category: 'LV Function' },
      { id: 'lvedd', label: 'LV End-Diastolic Diameter (LVEDD)', type: 'number', unit: 'mm', defaultValue: 46, normalMin: 38, normalMax: 52, category: 'Chamber Dimensions' },
      { id: 'mitral_valve', label: 'Mitral Valve Flow', type: 'select', options: ['Normal leaflet motion', 'Mild Mitral Regurgitation (MR)', 'Moderate MR'], defaultValue: 'Normal leaflet motion', category: 'Valvular Assessment' },
      { id: 'pasp', label: 'Estimated PASP / RVSP', type: 'number', unit: 'mmHg', defaultValue: 24, normalMin: 15, normalMax: 30, category: 'Hemodynamics' }
    ]
  }
];
