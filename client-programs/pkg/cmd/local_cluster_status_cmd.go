package cmd

import (
	"github.com/spf13/cobra"

	"github.com/educates/educates-training-platform/client-programs/pkg/cluster"
)

func (p *ProjectInfo) NewLocalClusterStatusCmd() *cobra.Command {
	var c = &cobra.Command{
		Args:  cobra.NoArgs,
		Use:   "status",
		Short: "Status of the local Kubernetes cluster",
		RunE: func(_ *cobra.Command, _ []string) error {
			c := cluster.NewKindClusterConfig("")

			return c.ClusterStatus()
		},
	}

	return c
}
