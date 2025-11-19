import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "./Card";
import {
  FiEye,
  FiFileText,
  FiUpload,
  FiCheckCircle,
  FiMessageCircle,
} from "react-icons/fi";

const QuickActions = ({
  repair,
  onViewTask,
  onSendBill,
  onUploadProof,
  onMarkComplete,
  onMessage,
}) => {
  const navigate = useNavigate();

  const actions = [
    {
      id: "view-task",
      label: "View Task",
      icon: FiEye,
      onClick: () => onViewTask && onViewTask(repair),
      visible: repair && repair.status,
    },
    {
      id: "submit-bill",
      label: "Submit Bill",
      icon: FiFileText,
      onClick: () => onSendBill && onSendBill(repair),
      visible: repair && repair.status === "details_approved",
    },
    {
      id: "upload-proof",
      label: "Upload Proof",
      icon: FiUpload,
      onClick: () => onUploadProof && onUploadProof(repair),
      visible:
        repair &&
        (repair.status === "in_progress" ||
          repair.status === "details_approved"),
    },
    {
      id: "mark-complete",
      label: "Mark Job Completed",
      icon: FiCheckCircle,
      onClick: () => onMarkComplete && onMarkComplete(repair),
      visible: repair && repair.status === "details_approved",
    },
    {
      id: "message",
      label: "Message Cashier / Gidion",
      icon: FiMessageCircle,
      onClick: () => navigate("/messages"),
      visible: true,
    },
  ].filter((action) => action.visible);

  return (
    <Card className="mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={action.onClick}
              className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <Icon className="w-6 h-6 text-gray-400 group-hover:text-blue-600 mb-2" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-900 text-center">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
};

export default QuickActions;
