"use client";

import { useState } from "react";
import { trpc } from "~/trpc/client";
import { PageHeader } from "~/components/shared/page-header";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CategoryDialog } from "./_components/category-dialog";
import { TemplateCard } from "./_components/template-card";
import { TemplateEditor } from "./_components/template-editor";

export default function InvoicesPage() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const utils = trpc.useUtils();

  const { data: categories, isLoading: catLoading } = trpc.invoices.listCategories.useQuery({});
  const { data: templates, isLoading: tplLoading } = trpc.invoices.listTemplates.useQuery(
    { categoryId: selectedCategoryId ?? undefined },
  );

  const deleteCategoryMutation = trpc.invoices.deleteCategory.useMutation({
    onSuccess: () => {
      toast.success("Category deleted");
      utils.invoices.listCategories.invalidate();
      utils.invoices.listTemplates.invalidate();
      setSelectedCategoryId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteTemplateMutation = trpc.invoices.deleteTemplate.useMutation({
    onSuccess: () => {
      toast.success("Template deleted");
      utils.invoices.listTemplates.invalidate();
      setSelectedTemplateId(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const selectedTemplate = templates?.find((t) => t.id === selectedTemplateId) ?? null;
  const isEditing = !!selectedTemplate || showCreate;

  if (catLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Invoice Templates"
        description="Design and manage invoice templates."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Left Panel */}
        <div className="space-y-4">
          {/* Category Tabs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Categories</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCategoryDialogOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={selectedCategoryId === null ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategoryId(null)}
              >
                All
              </Badge>
              {categories?.map((cat) => (
                <div key={cat.id} className="flex items-center gap-1">
                  <Badge
                    variant={selectedCategoryId === cat.id ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedCategoryId(cat.id)}
                  >
                    {cat.name}
                  </Badge>
                  <button
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      if (confirm(`Delete category "${cat.name}"?`)) {
                        deleteCategoryMutation.mutate({ id: cat.id });
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Template List */}
          <div className="space-y-2">
            {tplLoading ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : (
              templates?.map((tpl) => (
                <TemplateCard
                  key={tpl.id}
                  template={tpl}
                  selected={tpl.id === selectedTemplateId}
                  onClick={() => {
                    setSelectedTemplateId(tpl.id);
                    setShowCreate(false);
                  }}
                  onDelete={() => {
                    if (confirm(`Delete template "${tpl.name}"?`)) {
                      deleteTemplateMutation.mutate({ id: tpl.id });
                    }
                  }}
                />
              ))
            )}

            {!tplLoading && templates?.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No templates yet.
              </p>
            )}
          </div>

          <Button
            className="w-full"
            variant="outline"
            onClick={() => {
              setSelectedTemplateId(null);
              setShowCreate(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Create Template
          </Button>
        </div>

        {/* Right Panel */}
        <div>
          {isEditing ? (
            <TemplateEditor
              key={selectedTemplate?.id ?? "new"}
              template={selectedTemplate as never}
              categories={categories ?? []}
              onSuccess={() => {
                setShowCreate(false);
                utils.invoices.listTemplates.invalidate();
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Select a template to edit or create a new one.
            </div>
          )}
        </div>
      </div>

      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        onSuccess={() => utils.invoices.listCategories.invalidate()}
      />
    </div>
  );
}
