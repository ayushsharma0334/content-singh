// src/components/text-generator.tsx
"use client";

import type { FormEvent } from "react";
import React, { useState, useRef, useEffect, useTransition, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { generateContent, type GenerateContentInput, type GenerateContentOutput } from "@/ai/flows/generate-content";
import { translateContent, type TranslateContentInput, type TranslateContentOutput } from "@/ai/flows/translate-content";
import { useToast } from "@/hooks/use-toast";
import { SendHorizontal, User, Loader2, Play, Pause, StopCircle, Mic, Languages, Copy, ThumbsUp, Settings } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage, supportedLanguages as uiSupportedLanguages } from '@/contexts/LanguageContext'; // Import useLanguage and the full list
import AccessibilityControls, { PopoverTrigger as AccessibilityPopoverTrigger } from './accessibility-controls'; // Import AccessibilityControls

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  language?: string; // Language of the AI message content
  originalText?: string; // Original English text if translated
}

// Declare SpeechRecognition variable, but initialize it client-side
let SpeechRecognition: any = null;

// Re-use the supportedLanguages from LanguageContext for the output dropdown
const outputLanguages = Object.entries(uiSupportedLanguages).map(([code, name]) => ({ code, name }));


export default function TextGenerator() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [tone, setTone] = useState("casual");
  const [contentType, setContentType] = useState("blog post"); // Default content type
  const [length, setLength] = useState("medium");
  const [outputLanguage, setOutputLanguage] = useState("en");
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false); // Tracks AI output translation
  const [isUiTranslating, setIsUiTranslating] = useState(false); // Tracks manual translation request (global disable)
  const [translatingMessageId, setTranslatingMessageId] = useState<string | null>(null); // Track specific message being manually translated
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { t, language: uiLanguage } = useLanguage(); // Get translation function and current UI language

  // State for Text-to-Speech
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // State for Speech-to-Text
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isClient, setIsClient] = useState(false);

  // State for Disability Context
  const [isPersonWithDisability, setIsPersonWithDisability] = useState(false);
  const [disabilityDescription, setDisabilityDescription] = useState("");

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    if (isClient && scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
      );
      if (scrollViewport) {
        setTimeout(() => {
            scrollViewport.scrollTop = scrollViewport.scrollHeight;
        }, 0);
      }
    }
  }, [isClient]);


  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);


  // Cleanup TTS and Speech Recognition
  useEffect(() => {
    const cancelSpeech = () => {
        if (isClient && typeof window !== 'undefined' && 'speechSynthesis' in window) {
            if (speechSynthesis.speaking || speechSynthesis.paused) {
                speechSynthesis.cancel();
            }
        }
        setIsSpeaking(false);
        setSpeakingMessageId(null);
        utteranceRef.current = null;
    };

    const stopRecognition = () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };

    return () => {
      cancelSpeech();
      stopRecognition();
    };
  }, [isClient]);

  // Stop speech if the speaking message is removed
   useEffect(() => {
     if (speakingMessageId && !messages.some(msg => msg.id === speakingMessageId)) {
         if (isClient && typeof window !== 'undefined' && 'speechSynthesis' in window) {
             if (speechSynthesis.speaking || speechSynthesis.paused) {
                 speechSynthesis.cancel();
             }
         }
         setIsSpeaking(false);
         setSpeakingMessageId(null);
         utteranceRef.current = null;
     }
   }, [messages, speakingMessageId, isClient]);


  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim() || isLoading || isTranslating || isUiTranslating || isListening || !isClient) return;

     if (isClient && typeof window !== 'undefined' && 'speechSynthesis' in window) {
         if (speechSynthesis.speaking || speechSynthesis.paused) {
           speechSynthesis.cancel();
           setIsSpeaking(false);
           setSpeakingMessageId(null);
           utteranceRef.current = null;
         }
     }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: input,
      sender: "user",
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    const currentInput = input;
    const currentTone = tone;
    const currentContentType = contentType;
    const currentLength = length;
    const currentOutputLanguage = outputLanguage;
    const currentIsDisabled = isPersonWithDisability;
    const currentDisabilityDesc = disabilityDescription;

    setInput("");
    setIsLoading(true);

    // Construct the base prompt based on selections
    let basePrompt = `Generate a ${currentLength} ${currentContentType} with a ${currentTone} tone about the following topic: ${currentInput}. Generate the content in English initially.`;


    // Prepare the input for the AI flow, including disability context if provided
    const aiInput: GenerateContentInput = {
       prompt: basePrompt, // Pass the structured prompt info
       isPersonWithDisability: currentIsDisabled ? true : undefined, // Only pass if true
       disabilityDescription: currentIsDisabled && currentDisabilityDesc.trim() ? currentDisabilityDesc.trim() : undefined, // Only pass if checked and has description
    };


    console.log("Sending structured input to AI flow:", aiInput);

    try {
      // Call the AI flow with the potentially enhanced input
      const aiOutput: GenerateContentOutput = await generateContent(aiInput);

      if (!aiOutput || typeof aiOutput.content !== 'string') {
         throw new Error(`AI did not return valid content. Received: ${JSON.stringify(aiOutput)}`);
      }

      let finalContent = aiOutput.content.trim();
      let originalContent = finalContent; // Keep original English content
      let finalLanguage = 'en';

      // Translate if a different language is selected for AI output
      if (currentOutputLanguage !== 'en') {
        setIsTranslating(true);
        console.log(`Translating AI content to ${currentOutputLanguage}`);
        try {
           const translateInput: TranslateContentInput = {
               textToTranslate: finalContent,
               targetLanguage: currentOutputLanguage,
           };
           const translationOutput: TranslateContentOutput = await translateContent(translateInput);
           finalContent = translationOutput.translatedText;
           finalLanguage = currentOutputLanguage;
        } catch (translateError) {
           console.error("AI Output Translation failed:", translateError);
           const langName = t(`languages.${currentOutputLanguage}`, outputLanguages.find(l => l.code === currentOutputLanguage)?.name || currentOutputLanguage);
           toast({
             variant: "destructive",
             title: t('textGenerator.translationErrorTitle', 'Translation Failed'),
             description: t('textGenerator.translationErrorDescription', 'Could not translate the content to {languageName}. Displaying original English content.', { languageName: langName }),
             duration: 5000,
           });
           originalContent = ''; // No separate original if translation failed
        } finally {
            setIsTranslating(false);
        }
      }


      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        text: finalContent,
        sender: "ai",
        language: finalLanguage, // Store the language code of the generated/translated content
        originalText: finalLanguage !== 'en' ? originalContent : undefined,
      };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);

    } catch (error) {
      console.error("Error generating content in TextGenerator:", error);
      const errorMessageText = error instanceof Error ? error.message : "An unknown error occurred.";
      const errorDisplayMessage = t('textGenerator.errorDescription', 'Failed to generate content. {errorMessage} Please check console for details or try again. Ensure your API key is configured correctly.', { errorMessage: errorMessageText });

      toast({
        variant: "destructive",
        title: t('textGenerator.errorTitle', 'Error Generating Content'),
        description: errorDisplayMessage,
        duration: 7000,
      });

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        text: `Sorry, I encountered an error. ${errorMessageText.includes('API key not valid') ? 'Please check your API key configuration.' : 'Please try again.'}`,
        sender: "ai",
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(scrollToBottom, 50);
    }
  };

  // --- Text-to-Speech Handlers ---
  const handlePlayPause = (messageId: string, text: string, langCode?: string) => {
     if (!isClient || !window.speechSynthesis) {
       toast({ variant: "destructive", title: t('textGenerator.ttsErrorTitle'), description: t('textGenerator.ttsErrorDescription') });
       return;
     }

    const synth = window.speechSynthesis;
    // Basic mapping from language code to locale string (expand as needed)
    const locale = langCode === 'hi' ? 'hi-IN' :
                   langCode === 'en' ? 'en-US' :
                   // Add more mappings based on supported TTS languages
                   'en-US'; // Default fallback

    if (speakingMessageId === messageId) {
        if (synth.paused) {
            synth.resume();
            setIsSpeaking(true);
        } else if (synth.speaking) {
            synth.pause();
            setIsSpeaking(false);
        } else {
            startSpeech(messageId, text, locale); // Restart if stopped
        }
    } else {
        if (synth.speaking || synth.paused) {
            synth.cancel();
        }
        startSpeech(messageId, text, locale);
    }
};

const startSpeech = (messageId: string, text: string, lang: string = 'en-US') => {
    if (!isClient || !window.speechSynthesis) return;

    const synth = window.speechSynthesis;
    utteranceRef.current = new SpeechSynthesisUtterance(text);
    utteranceRef.current.lang = lang;

    utteranceRef.current.onend = () => {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
        utteranceRef.current = null;
    };

    utteranceRef.current.onerror = (event) => {
        console.error("Speech synthesis error:", event.error);
        let errorDesc = t('textGenerator.ttsPlayErrorDescription');
         if (event.error === 'language-unavailable' || event.error === 'synthesis-failed') {
             errorDesc = t('textGenerator.ttsPlayLangErrorDescription', 'Could not play audio in the selected language ({lang}).', { lang });
         }
        toast({ variant: "destructive", title: t('textGenerator.ttsPlayErrorTitle'), description: errorDesc });
        setIsSpeaking(false);
        setSpeakingMessageId(null);
        utteranceRef.current = null;
    };

     const voices = synth.getVoices();
     const voice = voices.find(v => v.lang === lang) || voices.find(v => v.lang.startsWith(lang.split('-')[0]));
     if (voice) {
         utteranceRef.current.voice = voice;
     } else {
         console.warn(`No specific voice found for language: ${lang}. Using default.`);
     }

    synth.speak(utteranceRef.current);
    setIsSpeaking(true);
    setSpeakingMessageId(messageId);
};

  const handleStop = () => {
    if (isClient && window.speechSynthesis && (speechSynthesis.speaking || speechSynthesis.paused)) {
      speechSynthesis.cancel();
    }
     setIsSpeaking(false);
     setSpeakingMessageId(null);
     utteranceRef.current = null;
  };
  // --- End Text-to-Speech Handlers ---

  // --- Speech-to-Text Handler ---
   const handleMicClick = () => {
     if (!isClient || !SpeechRecognition) {
       toast({
         variant: "destructive",
         title: t('textGenerator.sttErrorTitle'),
         description: t('textGenerator.sttUnsupported'),
       });
       return;
     }

     if (isListening) {
       if (recognitionRef.current) {
           recognitionRef.current.stop();
       }
     } else {
       try {
          recognitionRef.current = new SpeechRecognition();
          recognitionRef.current.continuous = false;
          recognitionRef.current.interimResults = true;
          // Set recognition language based on UI language if supported
          if (uiSupportedLanguages[uiLanguage]) {
              // Map UI language code to speech recognition locale (might need adjustments)
              const speechLang = uiLanguage === 'hi' ? 'hi-IN' :
                                 uiLanguage === 'en' ? 'en-US' :
                                 uiLanguage === 'es' ? 'es-ES' :
                                 uiLanguage === 'fr' ? 'fr-FR' :
                                 // Add more mappings
                                 'en-US'; // Default fallback
              recognitionRef.current.lang = speechLang;
              console.log("Speech Recognition Language set to:", speechLang);
          } else {
              recognitionRef.current.lang = 'en-US'; // Default to English if UI lang not supported by STT
              console.log("Speech Recognition Language defaulting to en-US");
          }


          recognitionRef.current.onstart = () => {
            setIsListening(true);
            setInput("");
            toast({ title: t('textGenerator.sttListening'), description: t('textGenerator.sttSpeakNow') });
          };

          recognitionRef.current.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
              } else {
                interimTranscript += event.results[i][0].transcript;
              }
            }
             setInput(finalTranscript + interimTranscript);
          };

          recognitionRef.current.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
             let errorMsgKey = `sttErr${event.error.replace(/-/g, '')}`; // Basic mapping attempt
             let errorMsg = t(`textGenerator.${errorMsgKey}`, `Error: ${event.error}`); // Use 't' with fallback

             // More specific fallbacks if the key doesn't match
             if (errorMsg === `textGenerator.${errorMsgKey}`) { // Check if 't' returned the key itself
                 switch (event.error) {
                     case 'no-speech': errorMsg = t('textGenerator.sttErrNoSpeech'); break;
                     case 'audio-capture': errorMsg = t('textGenerator.sttErrAudioCapture'); break;
                     case 'not-allowed': errorMsg = t('textGenerator.sttErrNotAllowed'); break;
                     case 'network': errorMsg = t('textGenerator.sttErrNetwork'); break;
                     case 'aborted': console.log("Speech recognition aborted by user."); return;
                     default: errorMsg = `Error: ${event.error}`; break;
                 }
             }

            toast({ variant: "destructive", title: t('textGenerator.sttErrorTitle'), description: errorMsg });
             setIsListening(false);
             recognitionRef.current = null;
          };

          recognitionRef.current.onend = () => {
             setIsListening(false);
             recognitionRef.current = null;
             console.log("Speech recognition ended.");
          };

          recognitionRef.current.start();
       } catch (error) {
            console.error("Error starting speech recognition:", error);
            toast({
                variant: "destructive",
                title: t('textGenerator.sttErrorTitle', "Could Not Start Listening"), // Default title if key missing
                description: error instanceof Error ? error.message : "An unexpected error occurred.",
            });
            setIsListening(false);
            if (recognitionRef.current) {
                recognitionRef.current = null;
            }
       }
     }
   };
  // --- End Speech-to-Text Handler ---

   const micDisabled = !isClient || !SpeechRecognition || isLoading || isTranslating || isUiTranslating;

  // --- Manual Translation Handler ---
  const handleTranslateMessage = async (messageId: string, textToTranslate: string, targetLang: string) => {
     if (!textToTranslate || targetLang === (messages.find(msg => msg.id === messageId)?.language || 'en') || isUiTranslating || isLoading) return; // Don't translate if already in target language

     setIsUiTranslating(true);
     setTranslatingMessageId(messageId); // Set the ID of the message being translated
     const originalMessage = messages.find(msg => msg.id === messageId);
     if (!originalMessage) return;

     // Use the original English text if available, otherwise use the current text
     const textForTranslation = originalMessage.originalText || originalMessage.text;

     try {
       console.log(`Manually translating message ${messageId} to ${targetLang}`);
       const translateInput: TranslateContentInput = {
         textToTranslate: textForTranslation,
         targetLanguage: targetLang,
       };
       const translationOutput: TranslateContentOutput = await translateContent(translateInput);

       setMessages(prev => prev.map(msg => {
         if (msg.id === messageId) {
           return {
             ...msg,
             text: translationOutput.translatedText,
             language: targetLang,
             originalText: msg.originalText || textForTranslation, // Preserve original English if translating from it
           };
         }
         return msg;
       }));

       toast({ title: t('textGenerator.translateSuccessTitle', "Translation Successful"), description: t('textGenerator.translateSuccessDesc', "Content translated to {languageName}.", { languageName: t(`languages.${targetLang}`, outputLanguages.find(l => l.code === targetLang)?.name || targetLang) }) });

     } catch (error) {
       console.error("Manual translation failed:", error);
       const langName = t(`languages.${targetLang}`, outputLanguages.find(l => l.code === targetLang)?.name || targetLang);
       toast({
         variant: "destructive",
         title: t('textGenerator.translationErrorTitle', "Translation Failed"),
         description: t('textGenerator.translationErrorDescription', "Could not translate the content to {languageName}.", { languageName: langName }),
       });
     } finally {
       setIsUiTranslating(false);
       setTranslatingMessageId(null); // Reset the translating message ID
     }
   };

   // --- Copy Handler ---
   const handleCopy = async (text: string) => {
      try {
         await navigator.clipboard.writeText(text);
         toast({
            title: t('toast.copied', "Copied!"),
            description: t('toast.copiedDescText', "Content copied to clipboard."), // Use a specific description key
         });
      } catch (err) {
         console.error("Failed to copy text:", err);
         toast({
            variant: "destructive",
            title: t('toast.copyFailed', "Copy Failed"),
            description: t('toast.copyFailedDescText', "Could not copy content to clipboard."), // Use a specific description key
         });
      }
   };

   // --- Thumbs Up Handler ---
   const handleThumbsUp = (messageId: string) => {
      // Placeholder for feedback mechanism
      console.log("Thumbs up for message:", messageId);
      toast({
         title: t('textGenerator.feedbackThanksTitle', "Feedback Received"),
         description: t('textGenerator.feedbackThanksDesc', "Thank you for your feedback!"),
      });
      // Here you could potentially send feedback to a backend or analytics service
   };


  return (
    <Card className="w-full h-full flex flex-col shadow-lg rounded-lg overflow-hidden border border-border bg-card text-card-foreground">
      {/* Header with Dropdowns */}
      <CardHeader className="bg-secondary/50 border-b border-border p-4">
        <CardTitle className="text-lg font-semibold text-foreground">{t('textGenerator.title', 'Text Content Generator')}</CardTitle>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
          {/* Tone Selector */}
          <div>
            <Label htmlFor="tone-select" className="text-sm font-medium">{t('textGenerator.toneLabel', 'Tone')}</Label>
            <Select value={tone} onValueChange={setTone} disabled={isLoading || isTranslating || isUiTranslating}>
              <SelectTrigger id="tone-select" className="w-full h-9 mt-1 rounded-md border-input bg-background shadow-sm focus:border-primary focus:ring-primary">
                <SelectValue placeholder={t('tones.casual')} />
              </SelectTrigger>
              <SelectContent>
                {/* Translate tone options */}
                <SelectItem value="formal">{t('tones.formal', 'Formal')}</SelectItem>
                <SelectItem value="casual">{t('tones.casual', 'Casual')}</SelectItem>
                <SelectItem value="professional">{t('tones.professional', 'Professional')}</SelectItem>
                <SelectItem value="witty">{t('tones.witty', 'Witty')}</SelectItem>
                <SelectItem value="humorous">{t('tones.humorous', 'Humorous')}</SelectItem>
                <SelectItem value="informative">{t('tones.informative', 'Informative')}</SelectItem>
                <SelectItem value="persuasive">{t('tones.persuasive', 'Persuasive')}</SelectItem>
                <SelectItem value="poetic">{t('tones.poetic', 'Poetic')}</SelectItem>
                <SelectItem value="inspirational">{t('tones.inspirational', 'Inspirational')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Content Type Selector */}
          <div>
            <Label htmlFor="content-type-select" className="text-sm font-medium">{t('textGenerator.contentTypeLabel', 'Content Type')}</Label>
            <Select value={contentType} onValueChange={setContentType} disabled={isLoading || isTranslating || isUiTranslating}>
              <SelectTrigger id="content-type-select" className="w-full h-9 mt-1 rounded-md border-input bg-background shadow-sm focus:border-primary focus:ring-primary">
                <SelectValue placeholder={t('contentTypes.blogPost', 'Blog Post')} /> {/* Updated placeholder */}
              </SelectTrigger>
              <SelectContent>
                 {/* Translate content type options */}
                 <SelectItem value="blog post">{t('contentTypes.blogPost', 'Blog Post')}</SelectItem>
                 <SelectItem value="YouTube script">{t('contentTypes.youtubeScript', 'YouTube Script')}</SelectItem>
                 <SelectItem value="Twitter post">{t('contentTypes.twitterPost', 'Twitter Post')}</SelectItem>
                 <SelectItem value="Presentation Outline">{t('contentTypes.presentationOutline', 'Presentation')}</SelectItem>
                 <SelectItem value="Instagram caption">{t('contentTypes.instagramCaption', 'Instagram Caption')}</SelectItem>
                 <SelectItem value="LinkedIn post">{t('contentTypes.linkedinPost', 'LinkedIn Post')}</SelectItem>
                 <SelectItem value="story">{t('contentTypes.story', 'Story')}</SelectItem>
                 <SelectItem value="article summary">{t('contentTypes.articleSummary', 'Article Summary')}</SelectItem>
                 <SelectItem value="poem">{t('contentTypes.poem', 'Poem')}</SelectItem>
                 <SelectItem value="product description">{t('contentTypes.productDescription', 'Product Description')}</SelectItem>
                 <SelectItem value="advertisement copy">{t('contentTypes.advertisementCopy', 'Advertisement Copy')}</SelectItem>
                 <SelectItem value="email">{t('contentTypes.email', 'Email')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Content Length Selector */}
          <div>
            <Label htmlFor="length-select" className="text-sm font-medium">{t('textGenerator.lengthLabel', 'Content Length')}</Label>
            <Select value={length} onValueChange={setLength} disabled={isLoading || isTranslating || isUiTranslating}>
              <SelectTrigger id="length-select" className="w-full h-9 mt-1 rounded-md border-input bg-background shadow-sm focus:border-primary focus:ring-primary">
                <SelectValue placeholder={t('contentLengths.medium')} />
              </SelectTrigger>
              <SelectContent>
                {/* Translate length options */}
                <SelectItem value="short">{t('contentLengths.short', 'Short')}</SelectItem>
                <SelectItem value="medium">{t('contentLengths.medium', 'Medium')}</SelectItem>
                <SelectItem value="long">{t('contentLengths.long', 'Long')}</SelectItem>
                <SelectItem value="very short (bullet points)">{t('contentLengths.bulletPoints', 'Bullet Points')}</SelectItem>
                <SelectItem value="paragraph">{t('contentLengths.paragraph', 'Single Paragraph')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Output Language Selector */}
          <div>
            <Label htmlFor="output-language-select" className="text-sm font-medium">{t('textGenerator.outputLanguageLabel', 'Output Language')}</Label>
            <Select value={outputLanguage} onValueChange={setOutputLanguage} disabled={isLoading || isTranslating || isUiTranslating}>
              <SelectTrigger id="output-language-select" className="w-full h-9 mt-1 rounded-md border-input bg-background shadow-sm focus:border-primary focus:ring-primary">
                 <SelectValue placeholder={t('languages.en', 'English')} /> {/* Use t for placeholder */}
              </SelectTrigger>
              <SelectContent>
                 {outputLanguages.map(lang => (
                    // Use 't' for language names, fallback to original name
                    <SelectItem key={lang.code} value={lang.code}>{t(`languages.${lang.code}`, lang.name)}</SelectItem>
                 ))}
              </SelectContent>
            </Select>
          </div>
        </div>
         {/* Accessibility Context Inputs */}
         <div className="w-full space-y-2 mt-4 border-t border-border pt-4">
            <div className="flex items-center space-x-2">
                <Checkbox
                    id="disability-checkbox"
                    checked={isPersonWithDisability}
                    onCheckedChange={(checked) => setIsPersonWithDisability(Boolean(checked))}
                    disabled={isLoading || isTranslating || isUiTranslating}
                />
                <Label htmlFor="disability-checkbox" className="text-sm font-medium">
                   {t('textGenerator.isPersonWithDisabilityLabel', 'I am a person with a disability')}
                </Label>
            </div>
            {isPersonWithDisability && (
                <div className="space-y-1 pl-6">
                    <Label htmlFor="disability-description" className="text-sm font-medium text-muted-foreground">
                        {t('textGenerator.disabilityDescriptionLabel', 'Tell us more (optional, helps tailor content):')}
                    </Label>
                    <Textarea
                        id="disability-description"
                        placeholder={t('textGenerator.disabilityDescriptionPlaceholder', 'e.g., Visual impairment, use a screen reader')}
                        value={disabilityDescription}
                        onChange={(e) => setDisabilityDescription(e.target.value)}
                        className="min-h-[60px] resize-y rounded-md border-input bg-background shadow-sm focus:border-primary focus:ring-primary"
                        disabled={isLoading || isTranslating || isUiTranslating}
                    />
                </div>
            )}
        </div>
      </CardHeader>

      {/* Chat Area */}
      <CardContent className="flex-grow p-0 overflow-hidden">
        {isClient ? (
          <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
            <div className="space-y-4 pb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.sender === "ai" && (
                    <Avatar className="h-8 w-8 border border-border flex-shrink-0 bg-secondary rounded-full shadow-sm">
                      <AvatarFallback className="text-xs font-semibold text-secondary-foreground">
                          AI
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[85%] rounded-lg p-3 shadow-md relative group ${
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground"
                        : message.id.startsWith('error-')
                        ? "bg-destructive/10 text-destructive border border-destructive/30"
                        : "bg-card border border-border text-foreground" // Adjusted AI message style
                    }`}
                  >
                    {/* TTS and Translation Controls + Copy/Thumbs Up */}
                    {message.sender === 'ai' && !message.id.startsWith('error-') && message.text && (
                      <div className="absolute -top-2.5 -left-2.5 flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-background/80 backdrop-blur-sm rounded-full p-1 shadow-md border border-border/50 z-10">
                         {/* TTS Play/Pause */}
                         <Button
                           variant="ghost"
                           size="icon"
                           className="h-6 w-6 text-muted-foreground hover:text-foreground"
                           onClick={() => handlePlayPause(message.id, message.text, message.language)}
                           disabled={!isClient || isTranslating || isUiTranslating}
                           aria-label={speakingMessageId === message.id && isSpeaking ? t('textGenerator.pauseTooltip') : speakingMessageId === message.id && !isSpeaking ? t('textGenerator.resumeTooltip') : t('textGenerator.speakTooltip')}
                           title={speakingMessageId === message.id && isSpeaking ? t('textGenerator.pauseTooltip') : speakingMessageId === message.id && !isSpeaking ? t('textGenerator.resumeTooltip') : t('textGenerator.speakTooltip')}
                         >
                           {speakingMessageId === message.id && isSpeaking ? <Pause size={14} /> : <Play size={14} />}
                         </Button>
                         {/* TTS Stop */}
                         {(speakingMessageId === message.id) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={handleStop}
                              disabled={!isClient}
                              aria-label={t('textGenerator.stopTooltip')}
                              title={t('textGenerator.stopTooltip')}
                            >
                              <StopCircle size={14} />
                            </Button>
                        )}
                        {/* Translate Button & Dropdown */}
                        <Select
                           onValueChange={(targetLang) => {
                               const textToUse = message.originalText || message.text; // Prefer original English if available
                               handleTranslateMessage(message.id, textToUse, targetLang);
                           }}
                           value={message.language || 'en'} // Show current language, default to 'en' if undefined
                           disabled={isUiTranslating || isLoading}
                        >
                           <SelectTrigger
                             className="h-6 w-auto px-1 py-0 border-none bg-transparent text-muted-foreground hover:text-foreground focus:ring-0 focus:ring-offset-0 shadow-none"
                             aria-label={t('textGenerator.translateLabel', 'Translate content')}
                             title={t('textGenerator.translateLabel', 'Translate content')}
                           >
                             <Languages size={14} />
                           </SelectTrigger>
                           <SelectContent>
                             {outputLanguages.map(lang => (
                               <SelectItem
                                 key={lang.code}
                                 value={lang.code}
                                 disabled={lang.code === (message.language || 'en')} // Disable current language
                               >
                                 {t(`languages.${lang.code}`, lang.name)}
                               </SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                         {/* Copy Button */}
                         <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-primary"
                            onClick={() => handleCopy(message.text)}
                            disabled={isTranslating || isUiTranslating}
                            aria-label={t('textGenerator.copyTooltip', 'Copy content')}
                            title={t('textGenerator.copyTooltip', 'Copy content')}
                          >
                           <Copy size={14} />
                         </Button>
                         {/* Thumbs Up Button */}
                         <Button
                           variant="ghost"
                           size="icon"
                           className="h-6 w-6 text-muted-foreground hover:text-green-500" // Example hover color
                           onClick={() => handleThumbsUp(message.id)}
                           disabled={isTranslating || isUiTranslating}
                           aria-label={t('textGenerator.thumbsUpTooltip', 'Good response')}
                           title={t('textGenerator.thumbsUpTooltip', 'Good response')}
                         >
                           <ThumbsUp size={14} />
                         </Button>
                      </div>
                    )}
                     {/* Translation Loading Indicator (moved inside content box) */}
                    {/* Show only for the message currently being manually translated */}
                    {isUiTranslating && translatingMessageId === message.id && (
                      <div className="flex items-center space-x-2 text-muted-foreground text-xs mt-1">
                         <Loader2 className="h-3 w-3 animate-spin" />
                         <span>{t('textGenerator.translating', 'Translating...')}</span>
                      </div>
                     )}
                    {/* Message Text */}
                    <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                  </div>
                  {message.sender === "user" && (
                    <Avatar className="h-8 w-8 border border-border flex-shrink-0 bg-muted rounded-full shadow-sm">
                      <AvatarFallback className="text-muted-foreground">
                        <User size={18} />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {/* General Loading Indicator for AI response generation */}
              {isLoading && !isTranslating && ( // Show only when generating initial response
                <div className="flex items-start gap-3 justify-start">
                  <Avatar className="h-8 w-8 border border-border flex-shrink-0 bg-secondary rounded-full shadow-sm">
                     <AvatarFallback className="text-xs font-semibold text-secondary-foreground">
                         AI
                     </AvatarFallback>
                  </Avatar>
                  <div className="bg-card border border-border text-muted-foreground rounded-lg p-3 shadow-md inline-flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="text-sm">{t('textGenerator.generating', 'Generating...')}</span>
                  </div>
                </div>
              )}
               {/* AI Output Translation Indicator */}
              {isTranslating && messages[messages.length-1]?.sender === 'ai' && !messages[messages.length-1]?.id.startsWith('error-') && (
                   <div className="flex items-start gap-3 justify-start pl-11"> {/* Indent to align with AI message */}
                       <div className="text-muted-foreground text-xs mt-1 inline-flex items-center">
                           <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                           <span>{t('textGenerator.translating', 'Translating...')}</span>
                       </div>
                   </div>
               )}
            </div>
          </ScrollArea>
        ) : (
            <div className="flex justify-center items-center h-full p-4 text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('accessibility.loading', 'Loading...')}
            </div>
        )}
      </CardContent>

      {/* Input Footer */}
      <CardFooter className="p-4 border-t border-border bg-secondary/50">
        <form onSubmit={handleSubmit} className="flex w-full items-end space-x-2">
          <div className="relative flex-grow">
             <Textarea
              placeholder={isListening ? t('textGenerator.listeningPlaceholder', 'Listening...') : t('textGenerator.promptPlaceholder', 'Type your prompt here...')}
              value={input}
              onChange={handleInputChange}
              disabled={isLoading || isTranslating || isUiTranslating || !isClient}
              readOnly={isListening}
              className="pl-10 pr-3 rounded-md border-input bg-background shadow-sm focus:border-primary focus:ring-primary min-h-[40px] max-h-[150px] resize-none"
              rows={1}
              aria-label="Chat input"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !isListening) {
                   e.preventDefault();
                   handleSubmit(e as unknown as FormEvent<HTMLFormElement>);
                 }
              }}
            />
             <Button
               type="button"
               variant="ghost"
               size="icon"
               onClick={handleMicClick}
               disabled={micDisabled}
               className={`absolute left-1 bottom-1 h-8 w-8 text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed ${isListening ? 'text-destructive animate-pulse' : ''}`}
               aria-label={isListening ? t('textGenerator.micStopTooltip') : t('textGenerator.micTooltip')}
               title={isListening ? t('textGenerator.micStopTooltip') : micDisabled ? t('textGenerator.micDisabledTooltip') : t('textGenerator.micTooltip')}
             >
               <Mic size={18} />
             </Button>
          </div>
          <Button type="submit" disabled={isLoading || isTranslating || isUiTranslating || !input.trim() || isListening || !isClient} className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 rounded-md shadow-sm btn-hover-subtle" aria-label={t('textGenerator.submitButton')}>
            {(isLoading || isTranslating || isUiTranslating) ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SendHorizontal size={18} />
            )}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}

    