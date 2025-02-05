import { NextPage } from "next";
import { useState } from "react";
import Loading from "./loading";

const Questions: NextPage = () => {
  const [questionsInput, setQuestionsInput] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const speak = (text: string) => {
    if (!window.speechSynthesis) {
      console.error('Speech synthesis not supported');
      return;
    }

    // Create a new speech synthesis utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Optional: Customize the voice settings
    utterance.rate = 1.5;  // Speed of speech
    utterance.pitch = 1.5; // Voice pitch
    utterance.volume = 1.0; // Volume
    
    // Optional: Select a specific voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(voice => voice.lang.startsWith('en-'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    // Speak the text
    window.speechSynthesis.speak(utterance);
  };

  const handleSpeak = () => {
    speak(result);
  };

  async function onSubmit(event: any) {
    event.preventDefault();
    if (questionsInput.trim().length === 0) return;

    setLoading(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ questions: questionsInput }),
      });

      const data = await response.json();
      if (response.status !== 200) {
        throw data.error || new Error(`Request failed with status ${response.status}`);
      }

      setResult(data.result);
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={onSubmit}>
        <div className="mb-6">
          <label
            htmlFor="questions"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Ask your question
          </label>
          <textarea
            id="questions"
            rows={4}
            className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="Type your question here..."
            value={questionsInput}
            onChange={(e) => setQuestionsInput(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading || questionsInput.length === 0}
          className={`text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 ${
            (loading || questionsInput.length === 0) && "cursor-not-allowed opacity-50"
          }`}
        >
          Submit
        </button>
      </form>

      {loading && <Loading />}
      
      {result && (
        <div className="mt-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Answer:</h3>
          <div className="mt-2 text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
            {result}
          </div>
          <button
            onClick={handleSpeak}
            className="text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
          >
            Speak
          </button>
        </div>
      )}
    </div>
  );
};

export default Questions;
