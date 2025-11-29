"use client";
import React, { useState } from 'react';
import { HelpCircle, Plus, Minus } from 'lucide-react';

const faqData = [
  {
    question: "What do I need to get started?",
    answer: "Getting started is simple. You just need to sign up for an account, choose your preferred plan, and you can begin organizing your notes and tasks immediately via our dashboard."
  },
  {
    question: "What kind of customization is available?",
    answer: "We offer extensive customization options including custom tags, personalized workflows, theme selection (dark/light modes), and the ability to tailor AI suggestion parameters to your specific needs."
  },
  {
    question: "How easy is it to edit for beginners?",
    answer: "Extremely easy. Our interface is designed with a 'no-code' philosophy. If you can use a standard text editor, you can use our platform. The AI handles the complex structuring for you."
  },
  {
    question: "Let me know more about moneyback guarantee?",
    answer: "We offer a hassle-free 30-day money-back guarantee on all paid plans. If you're not completely satisfied within the first month, just reach out to support for a full refund."
  },
  {
    question: "Do I need to know how to code?",
    answer: "Absolutely not. Our platform is built for non-technical users. All AI features, integrations, and customizations are managed through an intuitive visual interface."
  },
  {
    question: "What will I get after purchasing the template?",
    answer: "Note: This question seems related to a template purchase, but in the context of this SaaS, it would mean: After subscribing, you get instant access to all premium features of your chosen plan, including unlimited AI usage, advanced integrations, and priority support."
  }
];

const FAQItem = ({ item, isOpen, onClick }) => {
  return (
    <div className={`group rounded-2xl sm:rounded-3xl border bg-[#0A0A0A] overflow-hidden transition-all duration-300 ${isOpen ? 'border-[#7C3AED]/50' : 'border-white/10 hover:border-[#7C3AED]/30'}`}>
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-4 sm:p-6 text-left focus:outline-none"
      >
        <span className="text-base sm:text-lg font-medium text-white group-hover:text-[#7C3AED] transition-colors leading-tight pr-3 sm:pr-4">
          {item.question}
        </span>
        <div className={`p-1.5 sm:p-2 rounded-full border border-white/10 bg-white/5 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 bg-[#7C3AED]/10 border-[#7C3AED]/30' : ''}`}>
          {isOpen ? (
             <Minus size={16} className="text-[#7C3AED] sm:hidden" />
          ) : (
             <Plus size={16} className="text-gray-400 group-hover:text-white sm:hidden" />
          )}
          {isOpen ? (
             <Minus size={20} className="text-[#7C3AED] hidden sm:block" />
          ) : (
             <Plus size={20} className="text-gray-400 group-hover:text-white hidden sm:block" />
          )}
        </div>
      </button>

      {/* Simple conditional rendering for the answer */}
      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 pb-4 sm:pb-6 px-4 sm:px-6' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <p className="text-gray-400 text-xs sm:text-sm leading-relaxed pt-2 border-t border-white/5">
            {item.answer}
          </p>
        </div>
      </div>
    </div>
  );
};

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null); // All closed by default

  const handleToggle = (col, idx) => {
    setOpenIndex(prev => {
      if (!prev) return { col, idx };
      if (prev.col === col && prev.idx === idx) return null;
      return { col, idx };
    });
  };

  // Split into two columns
  const leftFaqs = faqData.slice(0, 6);
  const rightFaqs = [
    {
      question: "Is my data secure?",
      answer: "Yes, we use industry-standard encryption and best practices to keep your data safe and private at all times."
    },
    {
      question: "Can I use it on mobile?",
      answer: "Absolutely! Our platform is fully responsive and works seamlessly on all devices, including smartphones and tablets."
    },
    {
      question: "How does AI help me?",
      answer: "Our AI assists you by suggesting tags, organizing notes, and automating repetitive tasks to boost your productivity."
    },
    {
      question: "Can I collaborate with others?",
      answer: "Yes, you can invite team members, assign tasks, and work together in real-time."
    },
    {
      question: "What integrations are available?",
      answer: "We support integrations with Google Drive, Slack, Trello, and more. You can connect your favorite tools easily."
    },
    {
      question: "How do I contact support?",
      answer: "You can reach our support team 24/7 via live chat or email. We're always here to help you."
    }
  ];

  return (
    <section className="bg-[#050505] py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 xl:px-12 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* --- Title & Subtitle at Top --- */}
        <div className="text-center mb-12 sm:mb-16">
          <div className="mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 sm:gap-4 pl-1.5 pr-4 sm:pr-6 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm shadow-sm">
              <span className="bg-[#6d28d9] text-white text-xs sm:text-sm font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-[0_0_10px_rgba(109,40,217,0.4)] flex items-center justify-center">
                <HelpCircle size={14} className="sm:hidden" />
                <HelpCircle size={16} className="hidden sm:block" />
              </span>
              <span className="text-lg sm:text-xl text-gray-300 font-medium">FAQ</span>
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-[56px] font-semibold leading-[1.2] tracking-tight mb-4 sm:mb-6 text-white px-2 sm:px-0">
            Frequently Asked <span className="text-white/30">Questions</span>
          </h2>
          <p className="text-gray-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-relaxed px-2 sm:px-0">
            Have questions? Our FAQ section has you covered with quick answers to the most common inquiries.
          </p>
        </div>
        {/* --- Two Column FAQ Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          <div className="flex flex-col gap-3 sm:gap-4">
            {leftFaqs.map((item, idx) => (
              <FAQItem
                key={idx}
                item={item}
                isOpen={openIndex && openIndex.col === 'left' && openIndex.idx === idx}
                onClick={() => handleToggle('left', idx)}
              />
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:gap-4">
            {rightFaqs.map((item, idx) => (
              <FAQItem
                key={idx}
                item={item}
                isOpen={openIndex && openIndex.col === 'right' && openIndex.idx === idx}
                onClick={() => handleToggle('right', idx)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}