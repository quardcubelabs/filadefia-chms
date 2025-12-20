import React from 'react';
import { Phone, Mail } from 'lucide-react';

interface ReportProps {
  year?: string;
  companyName?: string;
  preparedBy?: string;
  presentedTo?: string;
  phone?: string;
  email?: string;
}

const AnnualReport = (props: ReportProps) => {
  const {
    year = "2025",
    companyName = "INGOUDE COMPANY",
    preparedBy = "Avery Davis",
    presentedTo = "Jonathan Patterson",
    phone = "123-456-7890",
    email = "hello@reallygreatsite.com"
  } = props;

  return (
    <div className="relative w-full max-w-[700px] aspect-[1/1.414] bg-white overflow-hidden font-sans shadow-2xl mx-auto select-none">
      {/* Background Watermark Image */}
      <div 
        className="absolute inset-0 opacity-[0.07] grayscale pointer-events-none"
        style={{ 
          backgroundImage: `url('https://csspicker.dev/api/image/?q=modern+building+architecture&image_type=photo')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />

      {/* Top Red Banner with Logo */}
      <div 
        className="absolute top-0 left-0 w-[42%] h-[47%] bg-[#D34127] z-30 flex flex-col items-center pt-14 text-white"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 84%, 0 100%)' }}
      >
        <div className="mb-3">
          <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 15C50 15 35 35 35 50C35 65 50 85 50 85C50 85 65 65 65 50C65 35 50 15 50 15Z" stroke="currentColor" strokeWidth="2"/>
            <path d="M50 30C50 30 40 45 40 55C40 65 50 75 50 75C50 75 60 65 60 55C60 45 50 30 50 30Z" stroke="currentColor" strokeWidth="2"/>
            <path d="M30 40C30 40 15 55 15 65C15 75 30 85 30 85C30 85 45 75 45 65C45 55 30 40 30 40Z" stroke="currentColor" strokeWidth="2"/>
            <path d="M70 40C70 40 85 55 85 65C85 75 70 85 70 85C70 85 55 75 55 65C55 55 70 40 70 40Z" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>
        <div className="text-center tracking-[0.15em] font-black text-[1.1rem] leading-[1.1]">
          {companyName.split(' ').map((word, i) => (
            <div key={i}>{word}</div>
          ))}
        </div>
      </div>

      {/* Dark Gray Curved Frame */}
      <div 
        className="absolute top-[21%] left-0 w-[64%] h-[70%] border-[32px] border-[#2D343E] z-20"
        style={{ 
          borderLeft: 'none',
          borderBottom: 'none',
          borderTopRightRadius: '100px',
          clipPath: 'polygon(0 0, 100% 0, 100% 100%, 85% 100%, 85% 15%, 0 15%)'
        }}
      />

      {/* Main City Image */}
      <div 
        className="absolute top-[38%] left-0 w-[56%] h-[53%] z-10 overflow-hidden"
        style={{ borderTopRightRadius: '80px' }}
      >
        <img 
          src="https://csspicker.dev/api/image/?q=city+street+night+perspective&image_type=photo" 
          alt="City" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Main Title Text */}
      <div className="absolute top-[8%] right-[8%] text-right z-40">
        <h2 className="text-[#2D343E] text-[5.5rem] font-black tracking-tight leading-none mb-2">
          {year}
        </h2>
        <h1 className="text-[#D34127] text-[4.8rem] font-black leading-[0.85] tracking-tight">
          ANNUAL<br />REPORT
        </h1>
      </div>

      {/* Prepared/Presented Info */}
      <div className="absolute bottom-[16%] right-[10%] text-right space-y-8 z-40">
        <div>
          <p className="text-[#2D343E] font-bold text-xl mb-1">Prepared By :</p>
          <p className="text-[#7F8C8D] text-xl font-medium">{preparedBy}</p>
        </div>
        <div>
          <p className="text-[#2D343E] font-bold text-xl mb-1">Presented To :</p>
          <p className="text-[#7F8C8D] text-xl font-medium">{presentedTo}</p>
        </div>
      </div>

      {/* Bottom Red Footer Bar */}
      <div 
        className="absolute bottom-0 left-0 w-full h-[9%] bg-[#D34127] z-50 flex items-center justify-end px-12 text-white"
        style={{ clipPath: 'polygon(26% 0, 100% 0, 100% 100%, 0 100%)' }}
      >
        <div className="flex items-center gap-10 text-[1.05rem] font-semibold">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-full p-1">
              <Phone size={14} className="text-[#D34127]" fill="currentColor" />
            </div>
            <span>{phone}</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail size={20} className="text-white" />
            <span>{email}</span>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        .font-sans {
          font-family: 'Inter', sans-serif;
        }
        h1, h2 {
          font-family: 'Montserrat', sans-serif;
        }
      `}</style>
    </div>
  );
};

export default AnnualReport;