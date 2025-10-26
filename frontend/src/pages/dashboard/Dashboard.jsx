import { Link } from "react-router-dom";

const Dashboard = () => {
  const menuItems = [
    {
      title: "Sentiment Map",
      description: "Visualize and analyze sentiment data across your content",
      link: "/dashboard/sentiment-map",
      icon: "📊",
      color: "bg-blue-500",
    },
    {
      title: "AI Reply Generator",
      description: "Generate intelligent responses powered by AI",
      link: "/dashboard/ai-reply",
      icon: "🤖",
      color: "bg-purple-500",
    },
  ];

  return (
    <div>
      <h1 className="mb-2 font-bold text-gray-900 text-3xl">Dashboard</h1>
      <p className="mb-8 text-gray-600">
        Welcome back! Choose a tool to get started.
      </p>

      <div className="gap-6 grid grid-cols-1 md:grid-cols-2">
        {menuItems.map((item, index) => (
          <Link
            key={index}
            to={item.link}
            className="bg-white shadow-md hover:shadow-lg p-6 rounded-lg transition hover:-translate-y-1 transform"
          >
            <div className="flex items-start">
              <div
                className={`${item.color} text-white p-3 rounded-lg text-2xl mr-4`}
              >
                {item.icon}
              </div>
              <div className="flex-1">
                <h2 className="mb-2 font-semibold text-gray-900 text-xl">
                  {item.title}
                </h2>
                <p className="text-gray-600">{item.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Stats Overview */}
      <div className="gap-6 grid grid-cols-1 md:grid-cols-3 mt-8">
        <div className="bg-white shadow-md p-6 rounded-lg">
          <h3 className="mb-2 font-medium text-gray-500 text-sm">
            Total Analyses
          </h3>
          <p className="font-bold text-gray-900 text-3xl">0</p>
        </div>
        <div className="bg-white shadow-md p-6 rounded-lg">
          <h3 className="mb-2 font-medium text-gray-500 text-sm">
            AI Replies Generated
          </h3>
          <p className="font-bold text-gray-900 text-3xl">0</p>
        </div>
        <div className="bg-white shadow-md p-6 rounded-lg">
          <h3 className="mb-2 font-medium text-gray-500 text-sm">
            Average Sentiment
          </h3>
          <p className="font-bold text-gray-900 text-3xl">-</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
