"""Independent cross-check against Bio.PDB.PPBuilder (not the JS formula)."""
from pathlib import Path
import sys,json,math,hashlib
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE/'python-deps'))
import Bio
from Bio.PDB import PDBParser,PPBuilder

fixture=json.loads((HERE/'data/1crn-residues.json').read_text())
source=HERE/'data/1CRN.pdb'
structure=PDBParser(QUIET=True).get_structure('1CRN',str(source))
reference={}
for peptide in PPBuilder().build_peptides(structure):
    for residue,(phi,psi) in zip(peptide,peptide.get_phi_psi_list()):
        key=(residue.get_parent().get_parent().id+1,residue.get_parent().id,residue.id[1],residue.id[2].strip())
        reference[key]=(None if phi is None else math.degrees(phi),None if psi is None else math.degrees(psi))
assert len(reference)==46
comparisons=[]
missing=[]
for row in fixture['rows']:
    key=(row['model'],row['chain'],row['resSeq'],row['insertionCode'])
    pair=reference[key]
    for label,angle in zip(('phi','psi'),pair):
        actual=row[label]
        if angle is None:
            assert actual is None,(key,label,actual)
            missing.append({'rowId':row['id'],'angle':label})
        else:
            assert actual is not None,(key,label)
            circular=abs((actual-angle+180)%360-180)
            assert circular<0.001,(key,label,actual,angle,circular)
            comparisons.append({'rowId':row['id'],'angle':label,'javascriptDegrees':actual,'biopythonDegrees':angle,'absoluteCircularErrorDegrees':circular})
report={'status':'passed','independentImplementation':'Bio.PDB.PPBuilder.get_phi_psi_list','biopythonVersion':Bio.__version__,'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'fixtureSha256':hashlib.sha256((HERE/'data/1crn-residues.json').read_bytes()).hexdigest(),'javascriptImplementationSha256':hashlib.sha256((HERE/'geometry.mjs').read_bytes()).hexdigest(),'residues':len(fixture['rows']),'anglesCompared':len(comparisons),'missingAngles':missing,'maxAbsoluteCircularErrorDegrees':max(c['absoluteCircularErrorDegrees'] for c in comparisons),'toleranceDegrees':0.001,'notes':['JavaScript calculates with parsed double-precision coordinates; Bio.PDB stores coordinates as float32, causing tiny expected numerical differences.','This checks backbone-angle arithmetic and matching terminal-null handling for this curated fixture. It does not validate structural quality or general PDB/mmCIF ingestion.'],'comparisons':comparisons}
(HERE/'data/angle-verification.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='comparisons'},indent=2))
