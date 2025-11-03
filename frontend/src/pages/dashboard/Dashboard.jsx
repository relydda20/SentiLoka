import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import StatCard from "../../components/cards/StatCard";
import ReactApexChart from "react-apexcharts";
import bubbleIcon from "../../assets/icons/bubblechat-icon.png";
import starIcon from "../../assets/icons/star-icon.png";
import pinIcon from "../../assets/icons/pin-icon.png";
import smileyIcon from "../../assets/icons/smiley-icon.png";
import {
  fetchDashboardStats,
  fetchSentimentDistribution,
  fetchRatingDistribution,
  fetchSentimentTrends,
  fetchWordCloudData,
} from "../../services/dashboardService";
import {
  pieChartConfig,
  columnChartConfig,
  lineChartConfig,
} from "../../config/chartConfig";
import { hoverScaleTapShadow } from "../../utils/motionConfig";
import { motion } from "framer-motion";
import DashboardSectionCard from "../../components/cards/DashboardSectionCard";
import WordCloudComponent from "../../components/charts/WordCloudComponent";

const Dashboard = () => {
  const queryClient = useQueryClient();

  // --- Fetch Dashboard Data with React Query ---
  const {
    data: stats,
    isLoading: loadingStats,
    error: statsError,
  } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: fetchDashboardStats,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  const {
    data: sentimentDistribution,
    isLoading: loadingSentiment,
    error: sentimentError,
  } = useQuery({
    queryKey: ["sentimentDistribution"],
    queryFn: fetchSentimentDistribution,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  const {
    data: ratingDistribution,
    isLoading: loadingRating,
    error: ratingError,
  } = useQuery({
    queryKey: ["ratingDistribution"],
    queryFn: fetchRatingDistribution,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  const {
    data: sentimentTrends,
    isLoading: loadingTrends,
    error: trendsError,
  } = useQuery({
    queryKey: ["sentimentTrends"],
    queryFn: fetchSentimentTrends,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  // Word Cloud Query
  const {
    data: wordCloudData,
    isLoading: loadingWordCloud,
    error: wordCloudError,
    refetch: refetchWordCloud,
  } = useQuery({
    queryKey: ["wordCloudData"],
    queryFn: fetchWordCloudData,
    enabled: false, // Don't fetch automatically
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    cacheTime: 15 * 60 * 1000, // Keep in cache for 15 minutes
  });

  // Manual refresh function
  const refreshAllData = () => {
    queryClient.invalidateQueries(["dashboardStats"]);
    queryClient.invalidateQueries(["sentimentDistribution"]);
    queryClient.invalidateQueries(["ratingDistribution"]);
    queryClient.invalidateQueries(["sentimentTrends"]);
  };

  // Retry individual sections
  const retrySection = (queryKey) => {
    queryClient.invalidateQueries([queryKey]);
  };

  // Handle word cloud loading
  const handleLoadWordCloud = () => {
    if (!wordCloudData) {
      refetchWordCloud();
    }
  };

  // --- Stat Cards Config ---
  const statCards = stats
    ? [
        {
          title: "Total Review",
          value: stats.totalReviews.toLocaleString(),
          icon: bubbleIcon,
          footnote: `+${stats.totalReviewsChange}% from last month`,
          footnoteClassName: "text-emerald-600",
        },
        {
          title: "Average Rating",
          value: stats.averageRating.toString(),
          icon: starIcon,
          footnote: `+${stats.averageRatingChange}% from last month`,
          footnoteClassName: "text-emerald-600",
        },
        {
          title: "Positive Reviews",
          value: `${stats.positiveReviewsPercentage}%`,
          icon: smileyIcon,
          footnote: "Updated daily",
          footnoteClassName: "text-emerald-600",
        },
        {
          title: "Location",
          value: stats.totalLocations.toString(),
          icon: pinIcon,
        },
      ]
    : [];

  // --- Chart Series Data ---
  const pieChartSeries = sentimentDistribution
    ? [
        sentimentDistribution.positive,
        sentimentDistribution.neutral,
        sentimentDistribution.negative,
      ]
    : [];

  const columnChartSeries = ratingDistribution
    ? [
        {
          name: "Reviews",
          data: ratingDistribution.map((item) => item.count),
        },
      ]
    : [];

  const lineChartSeries = sentimentTrends
    ? [
        {
          name: "Positive Reviews",
          data: sentimentTrends.positive.map((item) => [
            new Date(item.date).getTime(),
            item.count,
          ]),
        },
        {
          name: "Neutral Reviews",
          data: sentimentTrends.neutral.map((item) => [
            new Date(item.date).getTime(),
            item.count,
          ]),
        },
        {
          name: "Negative Reviews",
          data: sentimentTrends.negative.map((item) => [
            new Date(item.date).getTime(),
            item.count,
          ]),
        },
      ]
    : [];

  // --- Loading Skeleton Components ---
  const StatCardSkeleton = () => (
    <div className="bg-white shadow-sm p-6 border border-gray-200 rounded-xl">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="bg-gray-200 mb-3 rounded w-24 h-4 animate-pulse"></div>
          <div className="bg-gray-200 mb-2 rounded w-20 h-8 animate-pulse"></div>
          <div className="bg-gray-200 rounded w-32 h-3 animate-pulse"></div>
        </div>
        <div className="bg-gray-200 rounded-full w-10 h-10 animate-pulse"></div>
      </div>
    </div>
  );

  const LoadingSkeleton = ({ height = "300px" }) => (
    <div
      className="bg-gray-100 rounded-xl animate-pulse"
      style={{ height }}
    ></div>
  );

  // --- Error Component ---
  const ErrorDisplay = ({ message, onRetry }) => (
    <div className="flex flex-col justify-center items-center gap-3 bg-red-50 p-6 border border-red-200 rounded-xl h-full min-h-[200px]">
      <div className="text-red-600 text-center">
        <p className="font-semibold">Error loading data</p>
        <p className="text-sm">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-white text-sm transition-colors"
      >
        Retry
      </button>
    </div>
  );

  // --- Main Dashboard Render ---
  return (
    <div className="mx-auto mt-28 w-full max-w-[1440px]">
      <div className="flex flex-col gap-2 mx-auto px-4 md:px-8 pb-8 w-full">
        {/* Header with Refresh Button */}
        <div className="flex items-center gap-2 my-4 ml-2">
          <h1 className="font-bold text-2xl">Dashboard</h1>
          <button
            onClick={refreshAllData}
            title="refresh data"
            className="flex items-center gap-2 hover:bg-[#FAF6E9] px-2 py-2 rounded-lg text-black transition-colors"
            disabled={
              loadingStats || loadingSentiment || loadingRating || loadingTrends
            }
          >
            <svg
              className={`w-4 h-4 ${
                loadingStats ||
                loadingSentiment ||
                loadingRating ||
                loadingTrends
                  ? "animate-spin"
                  : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        {/* Stat Cards */}
        <div className="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full">
          {loadingStats ? (
            <>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </>
          ) : statsError ? (
            <div className="col-span-full">
              <ErrorDisplay
                message={statsError.message}
                onRetry={() => retrySection("dashboardStats")}
              />
            </div>
          ) : (
            statCards.map((card, idx) => <StatCard key={idx} {...card} />)
          )}
        </div>

        {/* Middle Section */}
        <div className="gap-4 grid grid-cols-1 lg:grid-cols-2 w-full">
          {/* Pie Chart - Sentiment Distribution */}
          <DashboardSectionCard title="Sentiment Distribution">
            {loadingSentiment ? (
              <LoadingSkeleton height="300px" />
            ) : sentimentError ? (
              <ErrorDisplay
                message={sentimentError.message}
                onRetry={() => retrySection("sentimentDistribution")}
              />
            ) : (
              <ReactApexChart
                options={pieChartConfig}
                series={pieChartSeries}
                type="donut"
                height={300}
              />
            )}
          </DashboardSectionCard>

          {/* Column Chart - Rating Distribution */}
          <DashboardSectionCard title="Rating Distribution">
            {loadingRating ? (
              <LoadingSkeleton height="300px" />
            ) : ratingError ? (
              <ErrorDisplay
                message={ratingError.message}
                onRetry={() => retrySection("ratingDistribution")}
              />
            ) : (
              <ReactApexChart
                options={columnChartConfig(stats?.totalReviews || 10024)}
                series={columnChartSeries}
                type="bar"
                height={300}
              />
            )}
          </DashboardSectionCard>
        </div>

        {/* Lower Section */}
        <div className="gap-4 grid grid-cols-1 lg:grid-cols-2 w-full">
          {/* Line Chart - Sentiment Trends */}
          <DashboardSectionCard title="Sentiment Trends">
            {loadingTrends ? (
              <LoadingSkeleton height="350px" />
            ) : trendsError ? (
              <ErrorDisplay
                message={trendsError.message}
                onRetry={() => retrySection("sentimentTrends")}
              />
            ) : (
              <ReactApexChart
                options={lineChartConfig}
                series={lineChartSeries}
                type="line"
                height={350}
                width="100%"
              />
            )}
          </DashboardSectionCard>

          {/* Word Cloud - Frequent Words */}
          <DashboardSectionCard title="Word Cloud">
            {!wordCloudData ? (
              <div className="flex justify-center items-center content-center rounded-lg min-h-[350px] grow">
                <motion.button
                  title="Load Cloud Words"
                  className="bg-[#ECE8D9] hover:bg-[#FAF6E9] px-16 py-2.5 rounded-4xl text-[#2F4B4E]"
                  onClick={handleLoadWordCloud}
                  disabled={loadingWordCloud}
                  {...hoverScaleTapShadow}
                >
                  <span className="font-medium text-base tracking-wide">
                    {loadingWordCloud ? "Loading..." : "Load Cloud Words"}
                  </span>
                </motion.button>
              </div>
            ) : loadingWordCloud ? (
              <LoadingSkeleton height="350px" />
            ) : wordCloudError ? (
              <ErrorDisplay
                message={wordCloudError.message}
                onRetry={() => retrySection("wordCloudData")}
              />
            ) : (
              <WordCloudComponent words={wordCloudData} />
            )}
          </DashboardSectionCard>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
