from flask import Flask
from config import Config
from extensions import db
from models import InsuranceScheme

app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)

links = {
    'Arogya Sanjeevani Policy': 'https://www.irdai.gov.in/',
    'Saral Suraksha Bima': 'https://www.irdai.gov.in/',
    'Individual Health Insurance': 'https://policybazaar.com/',
    'Family Floater Health Insurance': 'https://policybazaar.com/',
    'Senior Citizen Health Insurance': 'https://policybazaar.com/',
    'Critical Illness Insurance': 'https://policybazaar.com/',
    'Cancer Insurance': 'https://policybazaar.com/',
    'Maternity Health Insurance': 'https://policybazaar.com/',
    'Top-up Health Insurance': 'https://policybazaar.com/',
    'Super Top-up Health Insurance': 'https://policybazaar.com/',
    'Hospital Cash Insurance': 'https://policybazaar.com/',
    'Personal Accident Insurance': 'https://policybazaar.com/',
    'Group Health Insurance': 'https://policybazaar.com/',
    
    'LIC Life Insurance Plans': 'https://licindia.in/',
    'SBI Life Insurance Plans': 'https://www.sbilife.co.in/',
    'HDFC Life Insurance Plans': 'https://www.hdfclife.com/',
    'ICICI Prudential Life Insurance Plans': 'https://www.iciciprulife.com/',
    'Max Life Insurance Plans': 'https://www.maxlifeinsurance.com/',
    'Tata AIA Life Insurance Plans': 'https://www.tataaia.com/',
    'Bajaj Allianz Life Insurance Plans': 'https://www.bajajallianzlife.com/',
    'Aditya Birla Sun Life Insurance Plans': 'https://lifeinsurance.adityabirlacapital.com/',
    'Kotak Mahindra Life Insurance Plans': 'https://www.kotaklife.com/',
    'PNB MetLife Insurance Plans': 'https://www.pnbmetlife.com/',
    'Canara HSBC Life Insurance Plans': 'https://www.canarahsbclife.com/',
    'IndiaFirst Life Insurance Plans': 'https://www.indiafirstlife.com/',
    
    'SBI General Health Insurance': 'https://www.sbigeneral.in/health-insurance',
    'HDFC ERGO Health Insurance': 'https://www.hdfcergo.com/health-insurance',
    'ICICI Lombard Health Insurance': 'https://www.icicilombard.com/health-insurance',
    'Tata AIG Health Insurance': 'https://www.tataaig.com/health-insurance',
    'Bajaj Allianz Health Insurance': 'https://www.bajajallianz.com/health-insurance.html',
    'Aditya Birla Health Insurance': 'https://www.adityabirlacapital.com/healthinsurance/',
    'Care Health Insurance': 'https://www.careinsurance.com/',
    'Niva Bupa Health Insurance': 'https://www.nivabupa.com/',
    'Star Health Insurance': 'https://www.starhealth.in/',
    'ManipalCigna Health Insurance': 'https://www.manipalcigna.com/',
    'ACKO Health Insurance': 'https://www.acko.com/health-insurance/',
    'Go Digit Health Insurance': 'https://www.godigit.com/health-insurance',
    'Royal Sundaram Health Insurance': 'https://www.royalsundaram.in/health-insurance',
    'New India Assurance Health Insurance': 'https://www.newindia.co.in/',
    'National Insurance Health Insurance': 'https://nationalinsurance.nic.co.in/',
    'Oriental Insurance Health Insurance': 'https://orientalinsurance.org.in/',
    'United India Insurance Health Insurance': 'https://uiic.co.in/'
}

def update_links():
    with app.app_context():
        schemes = InsuranceScheme.query.all()
        count = 0
        for s in schemes:
            if s.name in links:
                s.official_url = links[s.name]
                s.source_url = links[s.name]
                count += 1
        db.session.commit()
        print(f"Updated {count} links successfully!")

if __name__ == '__main__':
    update_links()
