"use client";

import { useOrganization, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { UploadButton } from "./upload-button";
import { FileCard } from "./file-card";
import Image from "next/image";
import { GridIcon, Loader2, RowsIcon } from "lucide-react";
import { SearchBar } from "./search-bar";
import { useState } from "react";
import { DataTable } from "./file-table";
import { columns } from "./columns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import { Label } from "@/components/ui/label";

type FileType = Doc<"files">["type"] | "all";

interface FileBrowserProps {
  title: string;
  favoritesOnly?: boolean;
  deletedOnly?: boolean;
}

interface FileWithFavorite extends Doc<"files"> {
  isFavorited: boolean;
}

interface FavoriteFile {
  _id: Id<"favorites">;
  fileId: Id<"files">;
  orgId: string;
}

function Placeholder() {
  return (
    <div className="flex flex-col gap-8 w-full items-center mt-24">
      <Image
        alt="an image of a picture and directory icon"
        width={300}
        height={300}
        src="/empty.svg"
      />
      <div className="text-2xl">You have no files, upload one now</div>
      <UploadButton />
    </div>
  );
}

export function FileBrowser({ title, favoritesOnly, deletedOnly }: FileBrowserProps) {
  const organization = useOrganization();
  const user = useUser();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<FileType>("all");

  const orgId: string | undefined = organization.isLoaded && user.isLoaded
    ? organization.organization?.id ?? user.user?.id
    : undefined;

  const { data: favorites, error: favoritesError } = useQuery(
    api.files.getAllFavorites,
    orgId ? { orgId } : "skip"
  );

  const { data: files, error: filesError } = useQuery(
    api.files.getFiles,
    orgId
      ? {
          orgId,
          type: type === "all" ? undefined : type,
          query,
          favorites: favoritesOnly,
          deletedOnly,
        }
      : "skip"
  );

  if (!organization.isLoaded || !user.isLoaded) {
    return <div>Loading...</div>;
  }

  if (favoritesError || filesError) {
    return <div>Error loading data</div>;
  }

  const isLoading = files === undefined;

  const modifiedFiles: FileWithFavorite[] = files?.map((file) => ({
    ...file,
    isFavorited: (favorites ?? []).some(
      (favorite: FavoriteFile) => favorite.fileId === file._id
    ),
  })) ?? [];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">{title}</h1>
        <SearchBar query={query} setQuery={setQuery} />
        <UploadButton />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-8 w-full items-center mt-24">
          <Loader2 className="h-32 w-32 animate-spin text-gray-500" />
          <div className="text-2xl">Loading your files...</div>
        </div>
      ) : files?.length === 0 ? (
        <Placeholder />
      ) : (
        <Tabs defaultValue="grid">
          <div className="flex justify-between items-center">
            <TabsList className="mb-2">
              <TabsTrigger value="grid" className="flex gap-2 items-center">
                <GridIcon />
                Grid
              </TabsTrigger>
              <TabsTrigger value="table" className="flex gap-2 items-center">
                <RowsIcon /> Table
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2 items-center">
              <Label htmlFor="type-select">Type Filter</Label>
              <Select
                value={type}
                onValueChange={(newType) => {
                  setType(newType as FileType);
                }}
              >
                <SelectTrigger id="type-select" className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="grid">
            <div className="grid grid-cols-3 gap-4">
              {modifiedFiles.map((file) => (
                <FileCard key={file._id} file={file} />
              ))}
            </div>
          </TabsContent>
          <TabsContent value="table">
            <DataTable columns={columns} data={modifiedFiles} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
